-- Migration 007 — onboarding requests, admin notifications, richer order/customer read-models.
--
-- Rollback: see db/migrations/ROLLBACK.md (drop new tables/columns in reverse order).

-- ---------------------------------------------------------------------------
-- Onboarding requests (managed store launch + existing-site intake).
-- Referral code is mandatory; admin approves before the merchant site goes live.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS onboarding_request (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('existing', 'new')),
  referral_code       TEXT NOT NULL,
  marketer_id         UUID REFERENCES marketer (id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN (
                          'submitted', 'under_review', 'provisioning',
                          'ready', 'delivered', 'rejected', 'archived'
                        )),
  payload             JSONB NOT NULL DEFAULT '{}',
  site_id             UUID REFERENCES site (id) ON DELETE SET NULL,
  estimated_ready_at  TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  admin_note          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_tenant ON onboarding_request (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_request (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_request (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS onboarding_status_event (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES onboarding_request (id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  actor_user_id UUID REFERENCES app_user (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_event_req ON onboarding_status_event (request_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- Platform notifications (admin alerts, merchant delivery notices).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience    TEXT NOT NULL CHECK (audience IN ('admin', 'merchant', 'affiliate')),
  user_id     UUID REFERENCES app_user (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  payload     JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_audience ON platform_notification (audience, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user ON platform_notification (user_id, read_at, created_at DESC);

-- ---------------------------------------------------------------------------
-- Richer synced order/customer read-models (merchant-owned store data).
-- ---------------------------------------------------------------------------

ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS subtotal_minor BIGINT NOT NULL DEFAULT 0;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS tax_minor BIGINT NOT NULL DEFAULT 0;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS shipping_minor BIGINT NOT NULL DEFAULT 0;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS discount_minor BIGINT NOT NULL DEFAULT 0;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS line_items JSONB;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS billing JSONB;
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS shipping_address JSONB;

ALTER TABLE synced_customer ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE synced_customer ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE synced_customer ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE synced_customer ADD COLUMN IF NOT EXISTS external_created_at TIMESTAMPTZ;

-- Site provisioning status for admin-delivered stores.
ALTER TABLE site DROP CONSTRAINT IF EXISTS site_status_check;
ALTER TABLE site
  ADD CONSTRAINT site_status_check CHECK (status IN (
    'pending', 'provisioning', 'connected', 'disconnected', 'error'
  ));
