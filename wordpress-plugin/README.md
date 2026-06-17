# wordpress-plugin — WordPress Commerce OS Companion

> **Status: runtime skeleton (Plugin PR 1 of 3).** This is **one plugin** — _WordPress
> Commerce OS Companion_ — with WooCommerce support as an **internal module**. It now contains
> a minimal, **installable, non-production** WordPress plugin (PHP runtime) alongside the
> original TypeScript contracts and safe examples. The plugin **collects no credentials, makes
> no network calls, calls no WooCommerce/WordPress API, registers no webhooks, and performs no
> mutations.** It exposes only an admin status page and two admin-authenticated local REST
> endpoints (status/health).
>
> Plugin PR plan: **1) runtime skeleton + admin UI + health/WooCommerce detection (this PR)**, 2) secure connection + read-only WooCommerce bridge, 3) webhooks + controlled actions.

## Purpose

The companion plugin is the richer, push-style half of the connection model (the other half
being the credential proxy in `apps/api`). Once built, it will let a managed WordPress store
securely connect, report its identity/health, discover WooCommerce capabilities, bridge
events, and configure webhooks — **without ever exposing store secrets to the merchant
dashboard** (`apps/client`). See `.kiro/specs/wordpress-commerce-os-platform/architecture.md`
and `security-model.md`.

## Not production-ready

This plugin is a **runtime skeleton**. It is installable and safe, but it explicitly does
**NOT** include, and must not gain here:

- ❌ No real backend connection / handshake and no real credentials collected or stored
  (not WP application passwords, not WooCommerce consumer keys/secrets, not webhook secrets,
  not hosting/FTP/cPanel credentials).
- ❌ No real backend calls and no real network requests (no `wp_remote_*`, no cURL).
- ❌ No real WooCommerce or WordPress REST API calls and no WooCommerce API key creation.
- ❌ No customer/order/product data access or exposure.
- ❌ No real webhook registration or event delivery, and no mutations (writes).
- ❌ No real crypto / signature verification / KMS, no database tables, no cron/background jobs.
- ❌ No new dependencies (no Composer, no npm runtime deps) and no production build/release.

## Local installation (runtime skeleton)

This is a manual, local-only install for development:

1. Copy the `wordpress-plugin/` directory into your WordPress install as
   `wp-content/plugins/wordpress-commerce-os-companion`.
2. In **wp-admin → Plugins**, activate **WordPress Commerce OS Companion**.
   WooCommerce is **optional** — the plugin activates with or without it.
3. A top-level **WordPress Commerce OS** menu appears in the admin sidebar. Open it to see
   plugin status, connection status (Not connected), WooCommerce status (Active / Missing /
   Unknown), health checks, a security notice, and the next-steps note.

### Admin-only REST endpoints

Both require the `manage_options` capability (no public/unauthenticated access):

- `GET /wp-json/wcos/v1/status` — plugin version, connection status, site/home URL,
  WooCommerce active flag + version, and a capability summary.
- `GET /wp-json/wcos/v1/health` — the health-check summary (ok / warning / error /
  not_configured).

### Current limitations / intentionally not implemented

- No connection to the backend (`apps/api`) yet — connection status is always
  `not_connected`.
- No WooCommerce REST calls; the WooCommerce module is **passive detection only**.
- No webhooks, no events, no mutations, no credential inputs, no settings forms for secrets.

### Naming (unique prefix)

`wcos_` functions · `WCOS_` classes · `wcos/v1` REST namespace · `wcos_` options ·
text domain `wordpress-commerce-os-companion`.

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
├── wordpress-commerce-os-companion.php   main plugin file (header, constants, bootstrap)
├── includes/                             PHP runtime (one plugin; WooCommerce is internal)
│   ├── class-wcos-plugin.php             bootstrap singleton
│   ├── class-wcos-admin.php              admin menu + read-only status page
│   ├── class-wcos-health.php             local health checks (no network)
│   ├── class-wcos-rest.php               admin-only /wcos/v1/status + /health
│   ├── class-wcos-woocommerce.php        internal WooCommerce detection module
│   ├── class-wcos-capabilities.php       capability helper (manage_options + summaries)
│   └── class-wcos-redaction.php          secret redaction for diagnostics/REST output
├── assets/admin.css                      admin page styles
├── uninstall.php                         removes only plugin-owned non-secret options
├── README.md · CONTRACT.md · SECURITY.md
├── tsconfig.json · .prettierrc.json      dependency-free contract type-check + formatting
├── src/                                  TypeScript contracts (design source of truth)
│   ├── index.ts · plugin-metadata.ts · site-identity.ts · handshake-contract.ts
│   ├── health-check-contract.ts · event-bridge-contract.ts · webhook-config-contract.ts
│   └── capabilities-contract.ts · disconnect-contract.ts · redaction-contract.ts
└── examples/                             safe, secret-free examples (fake domains only)
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
