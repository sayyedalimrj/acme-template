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
  receiver (plus not-implemented stubs that return safe errors).
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
    ├── adapters/                 woocommerceProxy, wordpressBridge, webhookReceiver (interfaces + stubs)
    ├── plugin/                   read-only plugin sync foundation (validators/ingestors/registry; pure)
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
