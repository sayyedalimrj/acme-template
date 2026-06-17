# wordpress-plugin — WooCommerce OS Companion (Contract / Skeleton)

> **Status: contract & spec only (Phase 9).** This package defines the _future_ secure
> WordPress companion plugin that will connect a merchant's WordPress/WooCommerce site to
> our backend/proxy (`apps/api`). It contains **only** TypeScript contracts, Markdown docs,
> and safe JSON/PHP **examples**. There is **no runnable plugin**, no PHP runtime logic, and
> no network code here.

## Purpose

The companion plugin is the richer, push-style half of the connection model (the other half
being the credential proxy in `apps/api`). Once built, it will let a managed WordPress store
securely connect, report its identity/health, discover WooCommerce capabilities, bridge
events, and configure webhooks — **without ever exposing store secrets to the merchant
dashboard** (`apps/client`). See `.kiro/specs/wordpress-commerce-os-platform/architecture.md`
and `security-model.md`.

## Not production-ready

This PR is a **design contract**. It explicitly does **NOT** include, and must not gain here:

- ❌ No real WordPress plugin runtime, activation/uninstall hooks, admin pages, or REST endpoints.
- ❌ No real credentials collected or stored (not WP application passwords, not WooCommerce
  consumer keys/secrets, not webhook secrets, not hosting/FTP/cPanel credentials).
- ❌ No real backend calls and no real webhook delivery.
- ❌ No real WooCommerce or WordPress API calls.
- ❌ No real crypto / signature verification / KMS.
- ❌ No database tables, cron/scheduled actions, or background jobs.
- ❌ No new dependencies (no Composer, no npm runtime deps) and no production build/release.

## Future responsibilities (documented, built later)

| Area                             | Future responsibility                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Site identity                    | Report safe, non-secret site/WordPress/WooCommerce environment metadata.                 |
| Secure connection handshake      | Verify site ownership and establish a connection without exposing secrets to the client. |
| Health check                     | Surface REST/WooCommerce/HTTPS/permalink/webhook readiness for diagnostics.              |
| WooCommerce capability discovery | Detect which read capabilities the site grants the connection.                           |
| Event bridge                     | Forward **summary-only** order/product/customer/coupon events to the backend.            |
| Webhook configuration            | Plan/register WooCommerce webhooks pointing at the backend receiver (later).             |
| Disconnect / revoke              | Stop event delivery, revoke credential metadata via backend, clean up connection state.  |
| Safe support diagnostics         | Produce **redacted** diagnostic reports that never contain secrets or full PII.          |

## Layout

```
wordpress-plugin/
├── README.md            this file
├── CONTRACT.md          end-to-end connection/data-flow contract overview
├── SECURITY.md          binding security rules for the companion plugin
├── tsconfig.json        standalone, dependency-free type-check config
├── .prettierrc.json     formatting (mirrors repo TS style; no dependency)
├── src/                 TypeScript contracts (types + pure, dependency-free helpers)
│   ├── index.ts
│   ├── plugin-metadata.ts
│   ├── site-identity.ts
│   ├── handshake-contract.ts
│   ├── health-check-contract.ts
│   ├── event-bridge-contract.ts
│   ├── webhook-config-contract.ts
│   ├── capabilities-contract.ts
│   ├── disconnect-contract.ts
│   └── redaction-contract.ts
└── examples/            safe, secret-free examples (fake domains only)
    ├── plugin-header.example.php
    ├── handshake-request.example.json
    ├── health-response.example.json
    └── webhook-event.example.json
```

## Relationship to `apps/api`

This is a **contract sibling**, not a runtime dependency. To avoid cross-package coupling
the plugin contract **does not import** from `apps/api` (or `apps/client`). It deliberately
keeps names compatible with the backend skeleton — `SiteId`, `TenantId`,
`SiteConnectionCapability` / capability names, `WebhookEventType` topics, `CredentialKind`,
and `AuditAction` — so a future `packages/shared` can unify them without churn.

## Type-checking

Dependency-free; type-check in isolation:

```
tsc -p wordpress-plugin --noEmit
```

There is intentionally no `package.json` and no entry point — this is a contract, not a
deployable artifact.
