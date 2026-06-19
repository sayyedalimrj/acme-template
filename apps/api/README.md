# apps/api — Backend / Proxy Skeleton

> **Status: skeleton only (Phase 8).** This package defines the _future_ secure boundary
> between the merchant dashboard (`apps/client`) and merchants' WordPress/WooCommerce
> stores. It is **interface-first and dependency-free**: only TypeScript types, contracts,
> and pure helper functions. There is **no running server** in this PR.

## Purpose

`apps/api` will become the single trust boundary (`Tenant → Site → Resource`) through which
all privileged store access flows. The client never talks to a store directly for anything
that needs secrets; it calls this backend, which holds credentials and returns only
frontend-safe data (see `.kiro/steering/security.md` and
`.kiro/specs/wordpress-commerce-os-platform/security-model.md`).

## What this skeleton is — and is NOT

This PR contains **only**:

- Backend-side domain types (tenant, user, site, credential **metadata**, audit log,
  permission/RBAC placeholder).
- Security helpers: secret redaction, a credential policy that **rejects raw secret
  fields**, and a safe error model with no stack traces.
- **Interface-only** adapter contracts: WooCommerce proxy, WordPress bridge, webhook
  receiver, and the platform **payment gateway** (plus not-implemented stubs that return safe
  errors).
- Future HTTP route contracts expressed as **types/descriptors** (no HTTP server).
- Small, secret-free mock tenants/sites and dependency-free example checks.

This PR explicitly does **NOT** include, and you must not add here yet:

- ❌ No real WooCommerce API calls. ❌ No real WordPress API calls.
- ❌ No real credentials stored anywhere (only **metadata**, never secret values).
- ❌ No real encryption / key management / KMS.
- ❌ No real auth provider, JWT, OAuth, or sessions.
- ❌ No real/production database.
- ❌ No webhook ingestion endpoint or real signature verification.
- ❌ No mutations (writes) to any store.
- ❌ No server runtime (Express/Fastify/Nest) and **no new dependencies**.
- ❌ No deployment config.

## Future responsibilities (documented, built later)

| Area                                 | Future responsibility                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Tenant / site model                  | Multi-tenant `Tenant → Site → Resource` hierarchy; per-site isolation.                                 |
| Credential vault                     | Encrypted-at-rest storage of per-site secrets; rotation/revocation. Skeleton stores **metadata only**. |
| WooCommerce proxy                    | Server-side signed read (and later, gated write) access to the WooCommerce REST API.                   |
| WordPress companion plugin handshake | Secure site-ownership verification and connection without exposing secrets to the client.              |
| Webhook receiver                     | Verified, idempotent ingestion of order/product/customer/coupon/inventory events.                      |
| Audit logs                           | Who/what/when/target for every privileged action, with secrets redacted.                               |
| RBAC                                 | `owner / manager / staff / viewer / support_admin / system` permissions, enforced server-side.         |
| Consent / privacy enforcement        | PII minimization, consent + opt-out, retention/export/delete paths.                                    |
| Provider adapters                    | SMS / AI / billing providers integrated server-side behind adapters (keys in backend env only).        |

## Layout

```
apps/api/
├── README.md
├── tsconfig.json                 standalone, dependency-free type-check config
└── src/
    ├── index.ts                  public barrel (types + helpers + stubs)
    ├── domain/                   tenant, user, site, credential, auditLog, permission
    ├── security/                 redaction, credentialPolicy, errors (+ examples)
    ├── adapters/                 woocommerceProxy, wordpressBridge, webhookReceiver, paymentGateway (interfaces + stubs)
    ├── plugin/                   read-only plugin sync foundation (validators/ingestors/registry; pure)
    ├── database/                 production DB schema + tenant isolation DESIGN (types/contracts only)
    ├── routes/                   future HTTP route contracts (types only)
    └── mock/                     secret-free mock tenants + sites
```

## Plugin read-only sync foundation (`src/plugin/`)

Pure, dependency-free contracts + validators + ingestors for the read-only sync package and
event batch produced by the WordPress companion plugin. There is **no transport, no
persistence, and no delivery** — ingestion returns normalized **in-memory** results only.

- `pluginSyncEnvelope.ts` — `PluginSyncEnvelope`, `PluginSyncPayload`, `PluginSyncResourceSummary`,
  validation/ingest result types, `PluginConnectionRecord`, `PluginDeliveryStatus`,
  `PluginSignatureVerificationResult`, `SiteSyncSnapshot`.
- `pluginSyncValidator.ts` — `validatePluginSyncEnvelope`, `validateNoRawPII`,
  `validateNoRawSecrets`, `validateResourceCaps`, `normalizePluginSyncPayload`. Rejects raw
  email/phone/address, authorization/bearer/basic, password, consumer key/secret, token,
  secret, webhook secret, oversized arrays, and unsafe shapes.
- `pluginSyncIngestor.ts` — `ingestPluginSyncEnvelope`, `buildSiteSyncSnapshot`,
  `mapPluginProductsToReadModel`, `mapPluginOrdersToReadModel`, `mapPluginCustomersToReadModel`
  (in-memory read models; no DB writes).
- `pluginEventIngestor.ts` — `ingestPluginEventBatch` (validated, capped, in-memory).
- `pluginSignature.ts` — `verifyPluginSignaturePlaceholder` (always `not_configured`) +
  `buildSignatureBaseString` (non-secret). Future HMAC / asymmetric verification documented.
- `pluginConnectionRegistry.ts` — `registerPluginConnectionPlaceholder` /
  `getPluginConnectionStatus` / `disconnectPluginConnectionPlaceholder` (in-memory, metadata
  only; rejects secret-bearing input).
- `pluginSyncFixtures.ts` / `pluginSyncExamples.ts` — safe fixtures (reserved
  `example-store.test` domain, no PII/secrets) and dependency-free example checks.

### Signed delivery foundation (framework-agnostic; no server)

- `pluginSignature.ts` — `buildSignatureBaseString`, `signPluginSyncPayload`,
  `verifyPluginSyncSignature`, `safeCompareSignatures` (HMAC-SHA256 over a canonical,
  non-secret base string; signing material is **injected**, never stored). The legacy
  `verifyPluginSignaturePlaceholder` remains for the no-material case.
- `pluginCrypto.ts` — dependency-free pure SHA-256 / HMAC-SHA256 (no Node/Web Crypto types),
  verified against published test vectors.
- `pluginSigningSecret.ts` — `PluginSigningSecretMetadata` / `…Status` / `…Provider`
  (metadata only; the real key is resolved via an injected provider, never committed) +
  `notConfiguredSigningSecretProvider`.
- `pluginReplayGuard.ts` — `checkReplayWindow`, `buildReplayKey`, `createInMemoryReplayGuard`,
  `recordOrRejectReplay` (in-memory; rejects stale timestamps + duplicate nonces).
- `pluginDeliveryRequest.ts` / `pluginDeliveryResponse.ts` — request headers (`x-wcos-*`),
  body, and a framework-agnostic result with a suggested status code (no Authorization/bearer/
  basic/API-key).
- `pluginDeliveryEndpoint.ts` — `handlePluginSyncDelivery(request, context)`: a PURE handler
  that validates headers → timestamp/replay → resolves injected signing material → verifies
  the HMAC signature → validates the envelope → ingests an in-memory snapshot. **No HTTP
  server, no Express/Fastify/Nest, no deployment, no DB, no external network.**

**No external delivery by default**, **no secrets**, **no raw PII**, **no mutations**, and **no
database**. The plugin's package shape (snake_case PHP) maps onto these camelCase contracts; a
mapping/transport layer arrives with real signed delivery (next phase).

### Controlled DEV read-only sync persistence (in-memory only; no DB)

A controlled, **development-only** persistence foundation for already-validated signed sync
data. It is still **not** production sync, **not** mutation, **not** a real database, **not** a
credential vault, and **not** a public deployment. Accepted snapshots are normalized to
summary-only read models and stored **only** in an in-memory dev repository.

- `pluginSyncState.ts` — the safe status union (`accepted_not_persisted`,
  `accepted_persisted_dev`, `rejected_invalid_signature`, `rejected_replay`,
  `rejected_validation`, `rejected_secret_detected`, `rejected_pii_detected`,
  `rejected_oversized`, `not_configured`), the two delivery modes (`validate_only` default,
  `validate_and_persist_dev`), and pure classification helpers.
- `pluginReadModels.ts` — normalized, summary-only read models: `SyncedSiteSnapshot`,
  `SyncedStoreSummary`, `SyncedProductSummary`, `SyncedOrderSummary`, `SyncedCustomerSummary`,
  `SyncedEventSummary`, `SyncRun`, `SyncRunStatus`, `SyncSource`, `SyncPersistenceResult`,
  `SyncPersistenceWarning`, `SyncAuditEntry`. No raw WooCommerce objects, no addresses, no
  phone, no raw email, no payment details, no order notes, no raw meta, no secrets.
- `pluginSyncRepository.ts` — `createInMemoryPluginSyncRepository()` with
  `saveSiteSnapshot` / `getSiteSnapshot` / `listSiteSnapshots` / `saveSyncRun` /
  `listSyncRuns` / `saveAuditEntry` / `listAuditEntries` / `clearDevRepository`. In-memory
  only, with safe caps; **no database, no filesystem, no localStorage, no external service**.
- `pluginSyncAudit.ts` — pure builders for summary-only `SyncAuditEntry` records.
- `pluginSyncPersistence.ts` — pure pipeline: `persistValidatedPluginSync(envelope, context)`,
  `persistPluginEventBatch(events, context)`, `buildReadModelsFromSnapshot(snapshot)`,
  `buildSyncRunFromDeliveryResult(result)`. Validation runs **before** any store, so raw PII /
  secrets / oversized payloads are rejected and never persisted.
- `pluginDeliveryEndpoint.ts` — `handlePluginSyncDelivery` now accepts an OPTIONAL persistence
  context. Default stays safe: with no context (or `validate_only`) it **never persists**;
  only `validate_and_persist_dev` with a provided repository persists to the in-memory dev
  store.

**Future next step:** a production database schema with per-tenant isolation (encrypted at
rest, retention/export/delete paths) — designed and built in a later phase, after review.

## Production database schema + tenant isolation DESIGN (`src/database/`)

A **design/contracts-only** model of the future production database. There is **no ORM, no
migration, no SQL, no database client, and no persistence** — only TypeScript types and pure
helpers so the isolation/visibility/retention contracts are concrete before any real database
lands. See `src/database/README.md` for the full detail.

- `schemaDesign.ts` — record types for every planned table (`TenantRecord`,
  `PlatformUserRecord`, `TenantMembershipRecord`, `SiteRecord`, `SiteConnectionRecord`,
  `PluginConnectionRecord`, `CredentialMetadataRecord`, `SyncRunRecord`, `SyncedProductRecord`,
  `SyncedOrderRecord`, `SyncedCustomerRecord`, `PluginEventRecord`, support/workflow/
  subscription/usage/billing records, `AuditLogRecord`, `SecuritySignalRecord`, plus
  future AI/SMS/media/campaign/automation usage records) + a table catalog with scoping
  descriptors, `validateRecordScoping`, and the sync read-model → table mapping.
- `accessPolicy.ts` — the `DataVisibilityLevel` model (`public_safe` … `secret_never_expose`),
  the `PlatformRole` taxonomy, role→visibility profiles, a field-visibility map, and a
  raw-secret-field guard. `secret_never_expose` is in **no** profile.
- `tenantIsolation.ts` — `TenantIsolationMode`, `TenantScopedQueryContext`,
  `TenantAccessDecision`, and `assertTenantScope` / `assertSiteScope` /
  `canAccessTenantRecord` / `canAccessSiteRecord` / `buildTenantScopedWhereClauseDescription`.
  **Default deny, least privilege, cross-tenant forbidden.**
- `dataRetention.ts` — retention policy catalog, tenant-deletion + site-disconnect behavior,
  audit-preservation rules, and a DSAR export/delete placeholder (design only).
- `schemaExamples.ts` — dependency-free example checks (`ALL_SCHEMA_DESIGN_EXAMPLES_PASS`).

**Design rules:** every tenant-scoped row carries `tenantId` (site-scoped → `siteId`,
sync-derived → `syncRunId`); raw secrets are never stored (credentials are metadata + an
opaque vault reference); raw PII lives only in explicitly gated `*Restricted` columns; billing
rows hold provider metadata only (no card data); the backend never touches a WordPress
database directly.

### Migration scaffold (`src/database/migrations/`)

A **scaffold-only** production migration plan — inert TypeScript **descriptors**, no SQL
runner, no ORM, no DB connection, no env values. Importing it executes nothing.

- `migrationTypes.ts` — descriptor types (`DatabaseMigration`, `MigrationTable`,
  `MigrationColumn`, `MigrationIndex`, `MigrationConstraint`, `MigrationOperation`,
  `MigrationRollbackPlan`, `MigrationSafetyCheck`, …) + pure column/index factories.
- `migrationManifest.ts` — the ordered `MIGRATION_MANIFEST` (001–004) + lookup/validation.
- `001_initial_platform_schema.ts` … `004_security_audit_usage.ts` — per-migration
  descriptors (tables, columns, indexes, constraints, tenant-scoping impact, rollback, safety
  checks).
- `migrationExamples.ts` — dependency-free checks (`ALL_MIGRATION_EXAMPLES_PASS`).
- Design docs: `dbProviderDecision.md`, `environmentContract.md` (names only, no values),
  `tenantIsolationChecklist.md`, `seedStrategy.md`, `rollbackStrategy.md`.

The scaffold enforces (via example checks): manifest ordering, `tenantId` on every
tenant-scoped table, `siteId`+`tenantId` on site-scoped tables, `syncRunId` on sync tables, no
raw-secret columns, no raw payload/meta columns in sync tables, rollback plans + safety checks
present, and an environment contract of NAMES only. **Next step:** a **database adapter
boundary and dev storage implementation**, then a real provider decision and the first applied
migration — built later, after review (not production mutation).

## Platform payment gateway contract (`src/adapters/paymentGateway.ts`)

Interface-only contract for how the **platform** charges a tenant for its own subscription
plan (NOT a merchant's WooCommerce store checkout — that stays inside the merchant's site).

- `PaymentGateway` — `createCheckout` (hosted redirect), `verifyPayment`, `getPaymentStatus`,
  `refundLater`, `handleWebhookLater`, plus `verifyPaymentWebhookSignaturePlaceholder` and the
  not-implemented stub `createNotImplementedPaymentGateway()`.
- Provider-agnostic (`stripe | zarinpal | idpay | nextpay | manual | mock`); the redirect →
  verify shape fits both Stripe Checkout and common Iranian gateways.
- **No card data, ever** (capture happens on the provider's hosted page); amounts are integer
  **minor units** + ISO-4217 currency; inputs are scanned and raw secret-like fields rejected;
  every call is tenant-scoped. Provider keys live **only** in backend env, never committed.
- Settled payments map to invoice **metadata** via `BillingEventRecord` (no PAN/card detail).

See the repo-root `DEPLOYMENT.md` for how to wire a real provider server-side at go-live.

## Hard rules for this package

- **No secrets** in code, mocks, tests, docs, config, or env — ever. Raw secret-like input
  is **rejected or redacted** by the security helpers.
- **No frontend imports from `apps/api`**, and `apps/api` never imports from `apps/client`.
- **No real network calls** and **no external APIs**.
- Interface-first, security-first, dependency-free.

## Type-checking

This package is dependency-free and can be type-checked in isolation once a TypeScript
toolchain is available:

```
tsc -p apps/api --noEmit
```

It has no `package.json` and no runtime entry point on purpose — it is a contract/skeleton,
not a deployable service.
