# Migration rollback guidance

Migrations are applied **forward-only** and tracked in `schema_migrations`. We deliberately do
**not** auto-run destructive "down" migrations against a live database. Rollback is a manual,
reviewed operation.

## Principles

- Migration `002_platform.sql` is **additive** (new tables + one widened `CHECK` constraint). It
  does not drop or rewrite existing data, so rolling it back only means dropping the new objects.
- Always take a backup first: `pg_dump <db> | gzip > backup.sql.gz`.
- Prefer a forward fix-migration over a rollback in production.

## Roll back migration 004 (taxonomy + meta — additive)

```sql
BEGIN;
DROP TABLE IF EXISTS synced_product_attribute, synced_product_brand, synced_product_tag,
  synced_attribute_term, synced_attribute, synced_brand, synced_tag CASCADE;
ALTER TABLE synced_product DROP COLUMN IF EXISTS meta;
ALTER TABLE synced_product DROP COLUMN IF EXISTS permalink;
ALTER TABLE synced_product_variant DROP COLUMN IF EXISTS meta;
DELETE FROM schema_migrations WHERE version = '004_product_taxonomy_meta.sql';
COMMIT;
```

## Roll back migration 003 (product catalog — additive)

```sql
BEGIN;
DROP TABLE IF EXISTS synced_product_image, synced_product_variant,
  synced_product_category, synced_category CASCADE;
ALTER TABLE synced_product DROP COLUMN IF EXISTS raw;
ALTER TABLE synced_product DROP COLUMN IF EXISTS type;
DELETE FROM schema_migrations WHERE version = '003_product_catalog.sql';
COMMIT;
```

## Roll back migration 002 (additive)

```sql
BEGIN;
DROP TABLE IF EXISTS payment_attempt, billing_event, subscription, plan,
  replay_nonce, plugin_event, webhook_event,
  synced_coupon, synced_customer, synced_order, synced_product, sync_run,
  plugin_connection, site_credential, site_connection, site,
  tenant_member, tenant, user_session CASCADE;

ALTER TABLE merchant DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE referral DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE commission DROP COLUMN IF EXISTS tenant_id;
DROP INDEX IF EXISTS uq_commission_referral_period;

-- Restore the original coarse role constraint (optional).
ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check;
ALTER TABLE app_user ADD CONSTRAINT app_user_role_check
  CHECK (role IN ('merchant', 'admin', 'affiliate', 'support'));

DELETE FROM schema_migrations WHERE version = '002_platform.sql';
COMMIT;
```

## Roll back migration 005 (sync progress columns — safe/non-destructive)

The progress columns are additive; rolling back just removes them (sync still works, only the
live progress UI loses its data source). Restore the original status constraint too:

```sql
BEGIN;
ALTER TABLE sync_run DROP CONSTRAINT IF EXISTS sync_run_status_check;
ALTER TABLE sync_run ADD CONSTRAINT sync_run_status_check
  CHECK (status IN ('running', 'success', 'failed'));
ALTER TABLE sync_run
  DROP COLUMN IF EXISTS phase, DROP COLUMN IF EXISTS message, DROP COLUMN IF EXISTS progress_percent,
  DROP COLUMN IF EXISTS products_total, DROP COLUMN IF EXISTS products_done,
  DROP COLUMN IF EXISTS orders_total, DROP COLUMN IF EXISTS orders_done,
  DROP COLUMN IF EXISTS customers_total, DROP COLUMN IF EXISTS customers_done,
  DROP COLUMN IF EXISTS coupons_total, DROP COLUMN IF EXISTS coupons_done,
  DROP COLUMN IF EXISTS media_total, DROP COLUMN IF EXISTS media_done;
DELETE FROM schema_migrations WHERE version = '005_sync_progress.sql';
COMMIT;
```

## Roll back migration 001 (baseline — destructive)

Only for a throwaway/dev database:

```sql
DROP TABLE IF EXISTS audit_log, platform_order, payout, commission, referral,
  merchant, marketer, otp_code, app_user CASCADE;
DELETE FROM schema_migrations WHERE version = '001_init.sql';
```
