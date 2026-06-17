# apps/api/src/database — Production schema & tenant isolation DESIGN

> **Status: design / contracts only.** This directory defines the _future_ production
> database for the WordPress Commerce OS platform as **pure TypeScript types and helpers**.
> There is **no ORM, no migration, no SQL, no database client, and no persistence** here. It
> exists so the tenant-isolation, data-visibility, and retention contracts have concrete
> shapes to reason about before any real database is built. See
> `.kiro/specs/wordpress-commerce-os-platform/security-model.md`.

## What this is — and is NOT

- ✅ TypeScript record types for every planned table.
- ✅ A tenant-isolation contract (pure predicates; **default deny**, least privilege).
- ✅ A field/data visibility model and role→visibility profiles.
- ✅ A retention/deletion policy design and a sync read-model → table mapping.
- ✅ Dependency-free example checks.
- ❌ **No** real database (Postgres/MySQL/SQLite/etc.).
- ❌ **No** ORM/client (Prisma/Drizzle/Supabase/Firebase/TypeORM/Knex/pg/...).
- ❌ **No** migrations, SQL execution, file persistence, env config, or deployment.
- ❌ **No** auth runtime, billing provider, background jobs, cron, or webhooks.
- ❌ **No** mutations and **no** secrets — raw secrets are never stored in any table.

## Files

| File                 | Purpose                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemaDesign.ts`    | Record types for all tables + a table catalog with scoping descriptors, record-scoping validation, and the sync read-model → table mapping.                                                                                    |
| `accessPolicy.ts`    | `DataVisibilityLevel` model, `PlatformRole` taxonomy, role→visibility profiles, a field-visibility map, and a raw-secret-field guard.                                                                                          |
| `tenantIsolation.ts` | `TenantIsolationMode`, `TenantScopedQueryContext`, `TenantAccessDecision`/`Reason`, and `assertTenantScope` / `assertSiteScope` / `canAccessTenantRecord` / `canAccessSiteRecord` / `buildTenantScopedWhereClauseDescription`. |
| `dataRetention.ts`   | Retention policy catalog, tenant-deletion + site-disconnect behavior, audit-preservation rules, and a DSAR (export/delete) placeholder.                                                                                        |
| `schemaExamples.ts`  | Dependency-free example checks (`collectSchemaDesignExampleResults`, `ALL_SCHEMA_DESIGN_EXAMPLES_PASS`).                                                                                                                       |

## Tenant isolation principles

- **`Tenant → Site → Resource`** everywhere: every tenant-scoped row carries `tenantId`,
  site-scoped rows carry `siteId`, and sync-derived rows carry `syncRunId`.
- **Default deny.** No access without an explicit matching scope.
- **Cross-tenant queries are forbidden** by default; merchant roles may only reach their own
  tenant/site.
- **Internal roles need explicit scope:** `support_admin` → support scope, `billing_admin` →
  billing scope (billing-safe fields only), `security_admin` → security scope (security
  signals, never secrets), `system` → system scope.

## Field visibility

`public_safe < tenant_safe < support_safe < billing_restricted < security_restricted <
pii_restricted < secret_never_expose`. `secret_never_expose` is in **no** role profile —
raw secrets are never exposed and never stored in app tables. Raw customer PII lives only in
explicitly `*Restricted` (pii_restricted) columns that are empty by default and access-gated.

## Credential / vault design

`CredentialMetadataRecord` holds **metadata only** — kind, status, masked label, capability
scope, and an **opaque `vaultReference`**. The raw secret material (plugin signing secret,
WooCommerce consumer secret, WordPress application password, webhook secret) lives only in a
future external vault/KMS and is **never** stored in any app table, mock, test, or git.

## Direct WordPress database access

**Forbidden.** The backend never reads or writes a WordPress/WooCommerce database directly.
All synced data arrives via the validated, summary-only plugin sync path and is written under
the owning `tenantId` + `siteId` + `syncRunId` only after passing signature/PII/secret/cap
validation.

## Future recommended implementation step

A **production database implementation plan and migration scaffold** (engine choice, schema
DDL/migrations, per-tenant isolation enforcement such as row-level security, encryption at
rest, and DSAR export/delete flows) — designed and built in a later phase, after review.
