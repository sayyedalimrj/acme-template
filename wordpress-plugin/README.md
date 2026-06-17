# wordpress-plugin — WordPress Commerce OS Companion

> **Status: event bridge + controlled actions foundation (Plugin PR 3 of 3).** This is **one
> plugin** — _WordPress Commerce OS Companion_ — with WooCommerce, events, webhook config,
> controlled actions, and diagnostics all as **internal modules**. It is an **installable,
> non-production** WordPress plugin that adds a **local-only** summary event bridge (capped
> queue + admin/REST controls), a **webhook delivery placeholder** (no URL, no secret, no
> delivery), a **controlled-actions foundation** (every action **disabled**, no mutation), and
> a **local audit log** — on top of the existing connection state and read-only WooCommerce
> bridge. It still **collects no credentials, makes no network calls, calls no
> WooCommerce/WordPress REST API, creates no API keys, registers no real webhooks, delivers
> nothing externally, and performs no mutations.**
>
> Plugin PR plan: 1) runtime skeleton + admin UI + health/WooCommerce detection (shipped), 2) secure connection state + read-only WooCommerce bridge (shipped), **3) event/webhook
> bridge + controlled actions foundation (this PR)**.

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
- ❌ No real webhook registration/delivery and no event delivery — events stay in a **local,
  capped queue only**.
- ❌ No webhook/signing secret, no real signature verification, no idempotency engine, no
  retry/backoff — only non-secret placeholders.
- ❌ No mutations/writes of any kind — controlled actions are **disabled by default** and
  never apply changes.
- ❌ No real crypto / KMS, no database tables, no cron/Action Scheduler/background jobs.
- ❌ No new dependencies (no Composer, no npm runtime deps) and no production build/release.

## Local installation

This is a manual, local-only install for development:

1. Copy the `wordpress-plugin/` directory into your WordPress install as
   `wp-content/plugins/wordpress-commerce-os-companion`.
2. In **wp-admin → Plugins**, activate **WordPress Commerce OS Companion**.
   WooCommerce is **optional** — the plugin activates with or without it.
3. Open the top-level **WordPress Commerce OS** admin menu. You'll see:
   - **Connection** — status, local site/tenant identifiers, **Mark local readiness** /
     **Disconnect locally** (non-secret local state only; no network).
   - **WooCommerce read-only bridge** — active/version, read-capability readiness, counts.
   - **Event bridge** — bridge status (local queue only), queued-event count, supported event
     types, recent events, and **Add test event** / **Clear local queue** buttons.
   - **Webhook delivery (placeholder)** — delivery status, destination = not configured,
     secret = not configured, plus **Set local queue only** / **Disable delivery**.
   - **Controlled actions** — the future action intents, all **disabled** (no mutation).
   - **Audit (local)** — recent summary-only audit entries + **Clear audit log**.
   - **Health checks**, a **security notice**, and **next steps**.

### Admin-only REST endpoints (require `manage_options`)

No public/unauthenticated access. Responses are summary-only and redacted.

| Method | Endpoint                                           | Returns                                                                   |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/wp-json/wcos/v1/status`                          | plugin/connection status, site/home URL, WooCommerce + capability summary |
| GET    | `/wp-json/wcos/v1/health`                          | health-check summary (ok / warning / error / not_configured)              |
| GET    | `/wp-json/wcos/v1/connection`                      | non-secret local connection summary + site identity                       |
| POST   | `/wp-json/wcos/v1/connection/local-ready`          | mark local readiness (non-secret options only)                            |
| POST   | `/wp-json/wcos/v1/connection/disconnect`           | clear local connection state                                              |
| GET    | `/wp-json/wcos/v1/woocommerce/summary`             | counts + read-capability readiness                                        |
| GET    | `/wp-json/wcos/v1/woocommerce/products?limit=10`   | product summaries (max 20)                                                |
| GET    | `/wp-json/wcos/v1/woocommerce/orders?limit=10`     | order summaries (max 20, generic customer label)                          |
| GET    | `/wp-json/wcos/v1/woocommerce/customers?limit=10`  | customer summaries (max 20, masked label)                                 |
| GET    | `/wp-json/wcos/v1/events?limit=20`                 | local event queue (summary-only) + bridge status                          |
| POST   | `/wp-json/wcos/v1/events/test`                     | enqueue a synthetic, PII-free test event locally                          |
| POST   | `/wp-json/wcos/v1/events/clear`                    | clear the local event queue                                               |
| GET    | `/wp-json/wcos/v1/webhook-config`                  | non-secret delivery placeholder (no URL, no secret)                       |
| POST   | `/wp-json/wcos/v1/webhook-config/local-queue-only` | set delivery status = local queue only                                    |
| POST   | `/wp-json/wcos/v1/webhook-config/disable`          | set delivery status = disabled                                            |
| GET    | `/wp-json/wcos/v1/actions`                         | controlled-action intents (all disabled)                                  |
| POST   | `/wp-json/wcos/v1/actions/request`                 | placeholder — always disabled, never mutates                              |
| GET    | `/wp-json/wcos/v1/audit?limit=20`                  | recent local audit entries (summary-only)                                 |

Test as a logged-in admin, e.g. in the browser console:
`fetch('/wp-json/wcos/v1/events', { headers: { 'X-WP-Nonce': wpApiSettings.nonce } }).then(r => r.json())`.

### Current limitations / intentionally not implemented

- No connection to the backend (`apps/api`) yet — `backend_connected` is always `false`.
- The WooCommerce bridge is **read-only**: no REST calls, no API keys, no real webhooks,
  no writes.
- The event bridge is **local-only**: a capped queue (max 50) of summary-only events; nothing
  is delivered anywhere.
- The webhook config is a **placeholder**: no destination URL and no secret are stored.
- Controlled actions are **disabled**: requests always return `disabled` and never mutate.
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
│   ├── class-wcos-plugin.php             bootstrap singleton (+ registers event hooks)
│   ├── class-wcos-admin.php              admin menu + all sections (connection/bridge/events/webhook/actions/audit)
│   ├── class-wcos-connection.php         non-secret local connection state
│   ├── class-wcos-read-bridge.php        read-only, summarized WooCommerce reads
│   ├── class-wcos-data-sanitizer.php     summarize + mask/redact WooCommerce data (PII-safe)
│   ├── class-wcos-event-bridge.php       local summary-only event bridge (+ guarded WC hooks)
│   ├── class-wcos-event-sanitizer.php    summary-only event payloads (no PII)
│   ├── class-wcos-event-store.php        capped local event queue (max 50, no delivery)
│   ├── class-wcos-webhook-config.php     webhook delivery placeholder (no URL, no secret)
│   ├── class-wcos-controlled-actions.php disabled-by-default action intents (no mutation)
│   ├── class-wcos-audit.php              capped local audit log (summary-only)
│   ├── class-wcos-health.php             local health checks (no network)
│   ├── class-wcos-rest.php               admin-only /wcos/v1/* (status/health/connection/woocommerce/events/webhook-config/actions/audit)
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
