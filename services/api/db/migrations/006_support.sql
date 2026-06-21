-- 006_support.sql
-- Real merchant <-> admin support inbox: tickets + threaded messages, tenant-scoped, with
-- truthful per-side unread counters (no fake badges). Additive + idempotent.

CREATE TABLE IF NOT EXISTS support_ticket (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id         UUID REFERENCES site (id) ON DELETE SET NULL,
  created_by      UUID REFERENCES app_user (id) ON DELETE SET NULL,
  subject         TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'closed')),
  -- Truthful unread counters: incremented when the OTHER side posts, reset to 0 when that side reads.
  merchant_unread INT NOT NULL DEFAULT 0,  -- unseen-by-merchant (admin/system replies)
  admin_unread    INT NOT NULL DEFAULT 0,  -- unseen-by-admin (merchant messages)
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_ticket_tenant ON support_ticket (tenant_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_status ON support_ticket (status, last_message_at DESC);

CREATE TABLE IF NOT EXISTS support_message (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id      UUID NOT NULL REFERENCES support_ticket (id) ON DELETE CASCADE,
  sender_role    TEXT NOT NULL CHECK (sender_role IN ('merchant', 'admin', 'system')),
  sender_user_id UUID REFERENCES app_user (id) ON DELETE SET NULL,
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_message_ticket ON support_message (ticket_id, created_at);
