-- Migration 002 — production platform: tenants, sites, credential vault, sync read-models,
-- plugin/webhook events, billing, sessions, replay protection.
--
-- Design rules (binding):
--   * Money is stored as integer MINOR units (BIGINT). Never floats. Never card data.
--   * No raw secrets: WooCommerce keys + plugin signing secrets live ONLY in `site_credential`
--     encrypted with AES-256-GCM (key_version + iv + auth_tag + ciphertext). Plaintext never
--     touches the DB.
--   * Every tenant-scoped table has tenant_id; every site-scoped table has tenant_id + site_id.
--   * Idempotency: webhook/plugin events dedupe on a unique idempotency_key.
--
-- Rollback guidance: drop the objects created here in reverse dependency order. Because this is
-- additive (no destructive changes to migration 001 data beyond widening a CHECK constraint),
-- a rollback that drops only the new tables is safe. See db/migrations/ROLLBACK.md.

-- ---------------------------------------------------------------------------
-- Widen app_user roles to the granular production role set.
-- (merchant_owner/manager/staff/viewer, platform_admin, support_admin, affiliate, system)
-- Legacy values (merchant/admin/affiliate/support) are migrated forward.
-- ---------------------------------------------------------------------------

ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check;

UPDATE app_user SET role = 'merchant_owner' WHERE role = 'merchant';
UPDATE app_user SET role = 'platform_admin' WHERE role = 'admin';
UPDATE app_user SET role = 'support_admin'  WHERE role = 'support';

ALTER TABLE app_user
  ADD CONSTRAINT app_user_role_check CHECK (role IN (
    'platform_admin', 'support_admin',
    'merchant_owner', 'merchant_manager', 'merchant_staff', 'merchant_viewer',
    'affiliate', 'system'
  ));

-- ---------------------------------------------------------------------------
-- Refresh/session tokens (logout + rotation). Only a HASH of the refresh token is stored.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_session (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  portal              TEXT NOT NULL CHECK (portal IN ('merchant', 'admin', 'affiliate')),
  refresh_token_hash  TEXT NOT NULL,
  user_agent          TEXT,
  request_ip          TEXT,
  expires_at          TIMESTAMPTZ NOT NULL,
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_session_user ON user_session (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_token ON user_session (refresh_token_hash);

-- ---------------------------------------------------------------------------
-- Tenants (a merchant account / organization) and members (RBAC within a tenant).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  owner_user_id  UUID NOT NULL REFERENCES app_user (id) ON DELETE RESTRICT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_owner ON tenant (owner_user_id);

CREATE TABLE IF NOT EXISTS tenant_member (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'merchant_owner'
                CHECK (role IN ('merchant_owner', 'merchant_manager', 'merchant_staff', 'merchant_viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_member_user ON tenant_member (user_id);
CREATE INDEX IF NOT EXISTS idx_member_tenant ON tenant_member (tenant_id);

-- Link the existing merchant (platform billing/summary record) to a tenant.
ALTER TABLE merchant ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenant (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_merchant_tenant ON merchant (tenant_id);

-- ---------------------------------------------------------------------------
-- Sites (a connected WordPress/WooCommerce store) + connection challenges + credentials.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS site (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  url              TEXT NOT NULL,
  connection_mode  TEXT NOT NULL DEFAULT 'woo_rest'
                     CHECK (connection_mode IN ('woo_rest', 'plugin')),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
  woo_version      TEXT,
  wp_version       TEXT,
  currency         TEXT NOT NULL DEFAULT 'IRT',
  timezone         TEXT,
  last_synced_at   TIMESTAMPTZ,
  last_error       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_tenant ON site (tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_status ON site (status);

CREATE TABLE IF NOT EXISTS site_connection (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  mode            TEXT NOT NULL CHECK (mode IN ('woo_rest', 'plugin')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'failed', 'revoked')),
  challenge_nonce TEXT,                 -- ownership challenge (plugin handshake / verify)
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_siteconn_site ON site_connection (site_id);

-- Encrypted-at-rest credentials. NEVER store plaintext keys/secrets. AES-256-GCM envelope.
CREATE TABLE IF NOT EXISTS site_credential (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('woo_rest', 'plugin_signing', 'woo_webhook')),
  key_version  INTEGER NOT NULL DEFAULT 1,    -- which master key encrypted this
  iv           TEXT NOT NULL,                 -- base64 nonce
  auth_tag     TEXT NOT NULL,                 -- base64 GCM auth tag
  ciphertext   TEXT NOT NULL,                 -- base64 encrypted JSON payload
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cred_site_kind ON site_credential (site_id, kind, status);

CREATE TABLE IF NOT EXISTS plugin_connection (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'connected', 'revoked')),
  plugin_version TEXT,
  last_seen_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id)
);

-- ---------------------------------------------------------------------------
-- Sync runs + normalized read-models (per site). Money in minor units.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_run (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN ('woo_rest', 'plugin')),
  status       TEXT NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running', 'success', 'failed')),
  stats        JSONB,
  error        TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_syncrun_site ON sync_run (site_id, started_at DESC);

CREATE TABLE IF NOT EXISTS synced_product (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL,
  name          TEXT NOT NULL,
  sku           TEXT,
  status        TEXT,
  price_minor   BIGINT NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'IRT',
  stock_status  TEXT,
  stock_qty     INTEGER,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sproduct_site ON synced_product (site_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sproduct_sku ON synced_product (site_id, sku);

CREATE TABLE IF NOT EXISTS synced_order (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id            UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id          UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  external_id        TEXT NOT NULL,
  number             TEXT,
  status             TEXT,
  total_minor        BIGINT NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'IRT',
  customer_name      TEXT,
  external_created_at TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sorder_site ON synced_order (site_id, external_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sorder_status ON synced_order (site_id, status);

CREATE TABLE IF NOT EXISTS synced_customer (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  external_id       TEXT NOT NULL,
  display_name      TEXT,
  orders_count      INTEGER NOT NULL DEFAULT 0,
  total_spent_minor BIGINT NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'IRT',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_scustomer_site ON synced_customer (site_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS synced_coupon (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL,
  code          TEXT,
  discount_type TEXT,
  amount_minor  BIGINT NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'IRT',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_scoupon_site ON synced_coupon (site_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Webhook + plugin events (idempotent ingestion).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS webhook_event (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           TEXT NOT NULL CHECK (source IN ('woocommerce', 'payment', 'plugin')),
  site_id          UUID REFERENCES site (id) ON DELETE SET NULL,
  tenant_id        UUID REFERENCES tenant (id) ON DELETE SET NULL,
  event_type       TEXT NOT NULL,
  idempotency_key  TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'received'
                     CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  payload_summary  JSONB,
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  UNIQUE (source, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_webhook_created ON webhook_event (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_event (status);

CREATE TABLE IF NOT EXISTS plugin_event (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL,
  idempotency_key  TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'received'
                     CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  summary          JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_pluginevent_site ON plugin_event (site_id, created_at DESC);

-- Replay protection for signed plugin requests (nonce seen once per site, within a window).
CREATE TABLE IF NOT EXISTS replay_nonce (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  nonce       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, nonce)
);
CREATE INDEX IF NOT EXISTS idx_replay_expires ON replay_nonce (expires_at);

-- ---------------------------------------------------------------------------
-- Billing: plans, subscriptions, billing events, payment attempts.
-- Money in minor units. No card data. Provider secrets live in env, never here.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  price_minor  BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'IRT',
  interval     TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  features     JSONB,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES plan (id) ON DELETE RESTRICT,
  status              TEXT NOT NULL DEFAULT 'trialing'
                        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  provider            TEXT,
  provider_ref        TEXT,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_tenant ON subscription (tenant_id);

CREATE TABLE IF NOT EXISTS billing_event (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  subscription_id    UUID REFERENCES subscription (id) ON DELETE SET NULL,
  type               TEXT NOT NULL,                 -- invoice_paid / payment_failed / refund / ...
  amount_minor       BIGINT NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'IRT',
  provider           TEXT,
  provider_event_ref TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'recorded',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_ref)
);
CREATE INDEX IF NOT EXISTS idx_billing_tenant ON billing_event (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_attempt (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  plan_id          UUID NOT NULL REFERENCES plan (id) ON DELETE RESTRICT,
  subscription_id  UUID REFERENCES subscription (id) ON DELETE SET NULL,
  amount_minor     BIGINT NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'IRT',
  provider         TEXT NOT NULL,
  provider_ref     TEXT,                            -- opaque gateway authority/session id
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'requires_action', 'paid', 'failed', 'canceled', 'expired')),
  idempotency_key  TEXT NOT NULL UNIQUE,
  return_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payment_tenant ON payment_attempt (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_ref ON payment_attempt (provider, provider_ref);

-- ---------------------------------------------------------------------------
-- Affiliate attribution helper: pending referral attribution by code (pre-merchant signup).
-- ---------------------------------------------------------------------------

ALTER TABLE referral ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenant (id) ON DELETE SET NULL;
ALTER TABLE commission ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenant (id) ON DELETE SET NULL;
-- Prevent duplicate commission per (referral, period).
CREATE UNIQUE INDEX IF NOT EXISTS uq_commission_referral_period
  ON commission (referral_id, period) WHERE referral_id IS NOT NULL AND period IS NOT NULL;
