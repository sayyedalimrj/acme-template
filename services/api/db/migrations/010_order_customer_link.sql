-- Link synced orders to synced customers for reliable recent-order lookups.
ALTER TABLE synced_order ADD COLUMN IF NOT EXISTS customer_external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sorder_customer ON synced_order (site_id, customer_external_id);

-- Backfill chart dates for rows missing external_created_at.
UPDATE synced_order SET external_created_at = updated_at WHERE external_created_at IS NULL;
