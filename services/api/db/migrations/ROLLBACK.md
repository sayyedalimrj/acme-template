# Migration rollback guidance

Migrations are applied **forward-only** and tracked in `schema_migrations`. We deliberately do
**not** auto-run destructive "down" migrations against a live database. Rollback is a manual,
reviewed operation.

## Principles

- Migration `002_platform.sql` is **additive** (new tables + one widened `CHECK` constraint). It
  does not drop or rewrite existing data, so rolling it back only means dropping the new objects.
- Always take a backup first: `pg_dump <db> | gzip > backup.sql.gz`.
- Prefer a forward fix-migration over a rollback in production.

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

## Roll back migration 001 (baseline — destructive)

Only for a throwaway/dev database:

```sql
DROP TABLE IF EXISTS audit_log, platform_order, payout, commission, referral,
  merchant, marketer, otp_code, app_user CASCADE;
DELETE FROM schema_migrations WHERE version = '001_init.sql';
```
