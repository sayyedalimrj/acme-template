-- Portal platform schema (Postgres).
--
-- Auth/OTP + the three portals' core data (merchants, marketers, referrals, commissions,
-- payouts, platform orders) with strong foreign keys. Money is stored as integer minor units
-- (`*_amount` BIGINT, e.g. rials) — never floats, never card data. Raw OTP codes are NEVER
-- stored (only a salted hash). Apply with: `npm run migrate`.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Users & auth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_user (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile       TEXT NOT NULL UNIQUE,                     -- normalized 09xxxxxxxxx
  name         TEXT,
  email        TEXT,
  role         TEXT NOT NULL DEFAULT 'merchant'
                 CHECK (role IN ('merchant', 'admin', 'affiliate', 'support')),
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'suspended')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_app_user_role ON app_user (role);

-- One-time codes. We store only a salted HASH of the code, plus expiry/attempt metadata.
CREATE TABLE IF NOT EXISTS otp_code (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile       TEXT NOT NULL,
  code_hash    TEXT NOT NULL,
  portal       TEXT NOT NULL CHECK (portal IN ('merchant', 'admin', 'affiliate')),
  purpose      TEXT NOT NULL DEFAULT 'login',
  attempts     INTEGER NOT NULL DEFAULT 0,
  consumed_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  request_ip   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile_created ON otp_code (mobile, created_at DESC);

-- ---------------------------------------------------------------------------
-- Marketers (affiliates)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marketer (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  code                 TEXT NOT NULL UNIQUE,             -- public referral code
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  commission_rate_bps  INTEGER NOT NULL DEFAULT 2000,    -- basis points (2000 = 20%)
  tier                 TEXT NOT NULL DEFAULT 'standard',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketer_user ON marketer (user_id);

-- ---------------------------------------------------------------------------
-- Merchants (store owners)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS merchant (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  store_name               TEXT NOT NULL,
  url                      TEXT,
  plan                     TEXT NOT NULL DEFAULT 'starter'
                             CHECK (plan IN ('starter', 'growth', 'pro', 'managed')),
  status                   TEXT NOT NULL DEFAULT 'trial'
                             CHECK (status IN ('active', 'trial', 'past_due', 'suspended', 'canceled')),
  currency                 TEXT NOT NULL DEFAULT 'IRT',
  mrr_amount               BIGINT NOT NULL DEFAULT 0,    -- platform revenue from this merchant
  store_sales_amount       BIGINT NOT NULL DEFAULT 0,    -- the merchant's own store sales
  referred_by_marketer_id  UUID REFERENCES marketer (id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_merchant_user ON merchant (user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_referrer ON merchant (referred_by_marketer_id);
CREATE INDEX IF NOT EXISTS idx_merchant_status ON merchant (status);

-- ---------------------------------------------------------------------------
-- Referrals, commissions, payouts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS referral (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketer_id   UUID NOT NULL REFERENCES marketer (id) ON DELETE CASCADE,
  merchant_id   UUID REFERENCES merchant (id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'lead'
                  CHECK (status IN ('lead', 'trial', 'active', 'churned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_marketer ON referral (marketer_id);

CREATE TABLE IF NOT EXISTS commission (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketer_id   UUID NOT NULL REFERENCES marketer (id) ON DELETE CASCADE,
  referral_id   UUID REFERENCES referral (id) ON DELETE SET NULL,
  amount        BIGINT NOT NULL,                          -- minor units
  currency      TEXT NOT NULL DEFAULT 'IRT',
  rate_bps      INTEGER NOT NULL DEFAULT 2000,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'paid', 'reversed')),
  period        TEXT,                                     -- e.g. "1404-03"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commission_marketer ON commission (marketer_id, status);

CREATE TABLE IF NOT EXISTS payout (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketer_id         UUID NOT NULL REFERENCES marketer (id) ON DELETE CASCADE,
  amount              BIGINT NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'IRT',
  method              TEXT NOT NULL DEFAULT 'bank_card'
                        CHECK (method IN ('bank_card', 'bank_iban', 'wallet')),
  masked_destination  TEXT,                               -- e.g. "کارت •••• ۴۳۲۱" (never full PAN)
  status              TEXT NOT NULL DEFAULT 'requested'
                        CHECK (status IN ('requested', 'approved', 'paid', 'rejected')),
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payout_marketer ON payout (marketer_id, status);

-- ---------------------------------------------------------------------------
-- Platform-wide orders (read model across stores)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_order (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id    UUID NOT NULL REFERENCES merchant (id) ON DELETE CASCADE,
  number         TEXT NOT NULL,
  customer_name  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'on-hold', 'completed',
                                     'cancelled', 'refunded', 'failed')),
  total_amount   BIGINT NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'IRT',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_merchant ON platform_order (merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status ON platform_order (status);

-- ---------------------------------------------------------------------------
-- Audit log (who/what/when; secrets/PII redacted by the app before insert)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES app_user (id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  request_ip     TEXT,
  meta           JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at DESC);
