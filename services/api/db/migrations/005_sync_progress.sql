-- 005_sync_progress.sql
-- Extend sync_run with a real progress/phase model so the merchant UI can show live progress
-- (phase, percent, per-entity counters) instead of a blind "started" message. Additive + idempotent.

-- Widen the status set to include queued + cancelled (background job lifecycle).
ALTER TABLE sync_run DROP CONSTRAINT IF EXISTS sync_run_status_check;
ALTER TABLE sync_run
  ADD CONSTRAINT sync_run_status_check
  CHECK (status IN ('queued', 'running', 'success', 'failed', 'cancelled'));

ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS phase            TEXT;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS message          TEXT;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS progress_percent INT NOT NULL DEFAULT 0;

ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS products_total   INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS products_done    INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS orders_total     INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS orders_done      INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS customers_total  INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS customers_done   INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS coupons_total    INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS coupons_done     INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS media_total      INT NOT NULL DEFAULT 0;
ALTER TABLE sync_run ADD COLUMN IF NOT EXISTS media_done       INT NOT NULL DEFAULT 0;
