-- Social channel connections and publish jobs (tenant/site scoped).

CREATE TABLE IF NOT EXISTS social_connection (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id       UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  platform      TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  handle_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'disconnected',
  auth_type     TEXT NOT NULL DEFAULT 'manual',
  capabilities  JSONB NOT NULL DEFAULT '{}'::jsonb,
  token_iv      TEXT,
  token_auth_tag TEXT,
  token_ciphertext TEXT,
  token_key_version TEXT,
  auto_publish_enabled BOOLEAN NOT NULL DEFAULT false,
  caption_template TEXT,
  last_error    TEXT,
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_conn_site ON social_connection (site_id, platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_conn_site_platform ON social_connection (site_id, platform, display_name);

CREATE TABLE IF NOT EXISTS social_publish_job (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id         UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  connection_id   UUID NOT NULL REFERENCES social_connection (id) ON DELETE CASCADE,
  product_external_id TEXT NOT NULL,
  action          TEXT NOT NULL DEFAULT 'publish',
  status          TEXT NOT NULL DEFAULT 'queued',
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  external_post_id TEXT,
  external_post_url TEXT,
  error           TEXT,
  idempotency_key TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_job_idempotency ON social_publish_job (site_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_social_job_status ON social_publish_job (site_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS social_published_post (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id           UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  connection_id     UUID NOT NULL REFERENCES social_connection (id) ON DELETE CASCADE,
  product_external_id TEXT NOT NULL,
  platform          TEXT NOT NULL,
  external_post_id  TEXT,
  external_post_url TEXT,
  last_job_id       UUID REFERENCES social_publish_job (id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_post_unique ON social_published_post (connection_id, product_external_id);

CREATE TABLE IF NOT EXISTS social_channel_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenant (id) ON DELETE CASCADE,
  site_id       UUID NOT NULL REFERENCES site (id) ON DELETE CASCADE,
  connection_id UUID REFERENCES social_connection (id) ON DELETE SET NULL,
  job_id        UUID REFERENCES social_publish_job (id) ON DELETE SET NULL,
  level         TEXT NOT NULL DEFAULT 'info',
  message       TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_event_site ON social_channel_event (site_id, created_at DESC);
