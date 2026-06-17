# apps/api/src/database/migrations — Production migration SCAFFOLD

> **Status: scaffold / design only.** This directory describes the _planned_ production
> database migrations as **inert TypeScript descriptors**. There is **no migration runner, no
> SQL execution, no ORM, no database client, and no database connection** here. Importing any
> file in this directory executes nothing against any database. See
> `.kiro/specs/wordpress-commerce-os-platform/security-model.md`.

## What this is — and is NOT

- ✅ Dependency-free migration **descriptor types** (`migrationTypes.ts`).
- ✅ An **ordered manifest** of planned migrations (`migrationManifest.ts`).
- ✅ Four migration descriptors (`001`–`004`) describing tables, columns, indexes,
  constraints, operations, tenant-scoping impact, rollback plans, and safety checks.
- ✅ Dependency-free **example checks** (`migrationExamples.ts`).
- ❌ **No** SQL, DDL execution, or migration runner.
- ❌ **No** ORM / DB client (Prisma/Drizzle/Supabase/Firebase/TypeORM/Knex/pg/...).
- ❌ **No** database connection, env values, `.env` files, Docker, or deployment.
- ❌ **No** mutations and **no** secrets.

## Files

| File                               | Purpose                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `migrationTypes.ts`                | Descriptor types (`DatabaseMigration`, `MigrationTable`, `MigrationColumn`, …) + factories.                    |
| `migrationManifest.ts`             | Ordered `MIGRATION_MANIFEST` + lookup/validation helpers.                                                      |
| `001_initial_platform_schema.ts`   | tenants, platform_users, tenant_memberships, sites, site_connections, plugin_connections, credential_metadata. |
| `002_sync_read_models.ts`          | sync_runs, synced_products, synced_orders, synced_customers, plugin_events.                                    |
| `003_support_workflows_billing.ts` | support*\*, workflow*\*, plans, subscriptions, usage_limits, usage_counters, billing_events.                   |
| `004_security_audit_usage.ts`      | audit_logs, security_signals, ai_usage, sms_usage, media_generation_usage, campaigns, automation_rules.        |
| `migrationExamples.ts`             | Dependency-free checks (`ALL_MIGRATION_EXAMPLES_PASS`).                                                        |

## Design rules enforced by the scaffold

- **Tenant-scoped by default:** every tenant-scoped table carries `tenantId`; site-scoped
  tables carry `siteId` (and `tenantId`); sync-derived tables carry `syncRunId`.
- **No raw secret columns.** Credentials are metadata + an opaque vault reference only.
- **No raw payload/meta/PII columns** in sync tables — normalized summaries only; raw PII
  appears solely as explicitly gated `*Restricted` columns.
- **No payment card data** — subscription/billing tables hold provider metadata refs only.
- **Reversible-first** migrations; destructive audit/security rollbacks require manual approval.

## Sibling design docs

`../dbProviderDecision.md` · `../environmentContract.md` · `../tenantIsolationChecklist.md` ·
`../seedStrategy.md` · `../rollbackStrategy.md`.

## Next step

A **database adapter boundary and dev storage implementation** (a typed repository/adapter
seam with an in-memory/dev implementation first), then a real provider decision and the first
applied migration — built later, after review. This PR does **not** jump to production
mutation.
