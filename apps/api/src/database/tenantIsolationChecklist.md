# Tenant Isolation Enforcement Checklist

> **Status: design checklist.** A reviewable list of the isolation guarantees the production
> database + query layer must satisfy. It pairs with `tenantIsolation.ts` (pure predicates)
> and is enforced server-side later — not in this PR.

## Schema-level

- [ ] **Every tenant-scoped table has a non-null `tenantId`** column (FK → `tenants.id`).
- [ ] **Every site-scoped table has both `siteId` and `tenantId`** (FK → `sites.id`,
      `tenants.id`); a site always resolves to exactly one tenant.
- [ ] **Sync-derived tables carry `syncRunId`** (FK → `sync_runs.id`).
- [ ] **No raw secret columns** anywhere; credentials are metadata + an opaque vault
      reference.
- [ ] **Raw PII columns are restricted** (explicitly gated `*Restricted` columns, empty by
      default) and never required for normal operation.
- [ ] Foreign keys cannot cross tenants (a child row's `tenantId` must match its parent's).

## Query-level

- [ ] **Every query requires a tenant context**; there is no implicit "all tenants" query
      path in application code.
- [ ] Tenant scoping is applied as a **mandatory predicate** (and/or database row-level
      security) on every read and write.
- [ ] **Cross-tenant queries are forbidden by default** and require an explicit internal
      scope (see below) plus an audit entry.
- [ ] Default deny: a missing/empty tenant context yields no rows, never all rows.

## Role / access-level

- [ ] **Merchant roles** (`owner`/`manager`/`staff`/`viewer`) can reach **only their own
      tenant/site**.
- [ ] **`support_admin`** requires an explicit **support** scope; sees bounded `support_safe`
      fields only.
- [ ] **`billing_admin`** requires an explicit **billing** scope; sees `billing_restricted`
      fields only, never security or secret fields.
- [ ] **`security_admin`** requires an explicit **security** scope; can read security signals
      but **never** secrets.
- [ ] **System jobs** require an explicit **system** scope.
- [ ] **Cross-tenant admin queries** require an explicit internal scope and are audited.

## Data-flow / boundary

- [ ] **No direct WordPress/WooCommerce database access** — ever. All store data arrives via
      the validated, summary-only plugin sync path.
- [ ] **Plugin/backend sync data must pass validation** (signature + PII + secret + caps)
      **before persistence**; raw PII/secrets are rejected, never stored.
- [ ] Writes are scoped to the owning `tenantId` + `siteId` (+ `syncRunId` where applicable).

## Auditing (later)

- [ ] **All sensitive access is audited** (who/what/when/target), with secrets redacted.
- [ ] Audit logs and high-severity security signals are **preserved** independently of
      tenant/site deletion.
