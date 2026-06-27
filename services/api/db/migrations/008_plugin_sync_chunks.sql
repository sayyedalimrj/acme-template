-- 008_plugin_sync_chunks.sql
-- Chunk metadata for plugin sync runs (wcos.sync.v2). Additive + idempotent.

ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS entity         TEXT;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS chunk_number   INT;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS sync_run_group TEXT;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS received_count INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS inserted_count INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS updated_count  INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS skipped_count  INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS error_count    INT NOT NULL DEFAULT 0;

ALTER TABLE plugin_connection ADD COLUMN IF NOT EXISTS last_sync_at   TIMESTAMPTZ;
ALTER TABLE plugin_connection ADD COLUMN IF NOT EXISTS last_event_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_syncrun_group ON sync_run (sync_run_group, started_at DESC)
  WHERE sync_run_group IS NOT NULL;
