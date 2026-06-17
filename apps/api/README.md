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
    ├── routes/                   future HTTP route contracts (types only)
    └── mock/                     secret-free mock tenants + sites
```

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
