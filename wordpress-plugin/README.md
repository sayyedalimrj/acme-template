# wordpress-plugin — WordPress Commerce OS Companion

> **Status: secure connection state + read-only WooCommerce bridge (Plugin PR 2 of 3).** This
> is **one plugin** — _WordPress Commerce OS Companion_ — with WooCommerce support as an
> **internal module**. It is an **installable, non-production** WordPress plugin that now adds
> non-secret local connection state and a **read-only, summarized, admin-only** WooCommerce
> bridge. The plugin **collects no credentials, makes no network calls, calls no
> WooCommerce/WordPress REST API, creates no API keys, registers no webhooks, and performs no
> mutations.** WooCommerce data is read **locally** and returned only as redacted,
> PII-minimized summaries — nothing is sent anywhere.
>
> Plugin PR plan: 1) runtime skeleton + admin UI + health/WooCommerce detection (shipped),
> **2) secure connection state + read-only WooCommerce bridge (this PR)**, 3) event/webhook
> bridge + controlled actions foundation.

## Purpose

The companion plugin is the richer, push-style half of the connection model (the other half
being the credential proxy in `apps/api`). Once built, it will let a managed WordPress store
securely connect, report its identity/health, discover WooCommerce capabilities, bridge
events, and configure webhooks — **without ever exposing store secrets to the merchant
dashboard** (`apps/client`). See `.kiro/specs/wordpress-commerce-os-platform/architecture.md`
and `security-model.md`.

## Not production-ready

This plugin is a **non-production read-only bridge foundation**. It is installable and safe,
but it explicitly does **NOT** include, and must not gain here:

- ❌ No real backend connection / handshake and no real credentials collected or stored
  (not WP application passwords, not WooCommerce consumer keys/secrets, not webhook secrets,
  not hosting/FTP/cPanel credentials).
- ❌ No real backend calls and no real network requests (no `wp_remote_*`, no cURL).
- ❌ No WooCommerce/WordPress **REST API** calls and no WooCommerce API key creation.
- ❌ No data sent externally. WooCommerce data is read **locally** and only as redacted,
  PII-minimized summaries (no addresses, phones, raw emails, payment details, or order notes).
- ❌ No real webhook registration or event delivery, and no mutations/writes of any kind.
- ❌ No real crypto / signature verification / KMS, no database tables, no cron/background jobs.
- ❌ No new dependencies (no Composer, no npm runtime deps) and no production build/release.

## Local installation

This is a manual, local-only install for development:

1. Copy the `wordpress-plugin/` directory into your WordPress install as
   `wp-content/plugins/wordpress-commerce-os-companion`.
2. In **wp-admin → Plugins**, activate **WordPress Commerce OS Companion**.
   WooCommerce is **optional** — the plugin activates with or without it.
3. Open the top-level **WordPress Commerce OS** admin menu. You'll see:
   - **Connection** — status (Not connected / Local ready / …), local site/tenant identifiers,
     and **Mark local readiness** / **Disconnect locally** buttons (these update only
     non-secret local state; they make no network calls).
   - **WooCommerce read-only bridge** — active/version, read-capability readiness, and
     aggregate product/order/customer counts.
   - **Health checks**, a **security notice**, and **next steps**.

### Admin-only REST endpoints (require `manage_options`)

No public/unauthenticated access. Responses are summary-only and redacted.

| Method | Endpoint                                          | Returns                                                                   |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/wp-json/wcos/v1/status`                         | plugin/connection status, site/home URL, WooCommerce + capability summary |
| GET    | `/wp-json/wcos/v1/health`                         | health-check summary (ok / warning / error / not_configured)              |
| GET    | `/wp-json/wcos/v1/connection`                     | non-secret local connection summary + site identity                       |
| POST   | `/wp-json/wcos/v1/connection/local-ready`         | mark local readiness (non-secret options only)                            |
| POST   | `/wp-json/wcos/v1/connection/disconnect`          | clear local connection state                                              |
| GET    | `/wp-json/wcos/v1/woocommerce/summary`            | counts + read-capability readiness                                        |
| GET    | `/wp-json/wcos/v1/woocommerce/products?limit=10`  | product summaries (max 20)                                                |
| GET    | `/wp-json/wcos/v1/woocommerce/orders?limit=10`    | order summaries (max 20, generic customer label)                          |
| GET    | `/wp-json/wcos/v1/woocommerce/customers?limit=10` | customer summaries (max 20, masked label)                                 |

Test as a logged-in admin, e.g. in the browser console:
`fetch('/wp-json/wcos/v1/woocommerce/summary', { headers: { 'X-WP-Nonce': wpApiSettings.nonce } }).then(r => r.json())`.

### Current limitations / intentionally not implemented

- No connection to the backend (`apps/api`) yet — `backend_connected` is always `false` and
  connection state is local-only.
- The bridge is **read-only**: no WooCommerce REST calls, no API keys, no webhooks, no writes.
- Customer/order summaries never include raw PII (no email/phone/address) — labels are generic
  or masked.

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
│   ├── class-wcos-admin.php              admin menu + connection + read-only bridge page
│   ├── class-wcos-connection.php         non-secret local connection state
│   ├── class-wcos-read-bridge.php        read-only, summarized WooCommerce reads
│   ├── class-wcos-data-sanitizer.php     summarize + mask/redact WooCommerce data (PII-safe)
│   ├── class-wcos-health.php             local health checks (no network)
│   ├── class-wcos-rest.php               admin-only /wcos/v1/* status/health/connection/woocommerce
│   ├── class-wcos-woocommerce.php        internal WooCommerce detection + counts + read caps
│   ├── class-wcos-capabilities.php       capability helper (manage_options + plugin caps)
│   └── class-wcos-redaction.php          secret/PII redaction for diagnostics/REST output
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
