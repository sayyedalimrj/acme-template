# Companion Plugin — Security Rules (binding)

Extends `.kiro/steering/security.md` and
`.kiro/specs/wordpress-commerce-os-platform/security-model.md` to the future companion
plugin. Binding for all current and future work in this package.

## Hard rules (no exceptions)

1. **No secrets anywhere** — not in code, contracts, mocks, examples, docs, config, or env.
   This includes WordPress admin passwords, WordPress application passwords, WooCommerce
   consumer keys/secrets, webhook secrets, API provider keys, and hosting/cPanel/FTP creds.
2. **The client never receives secrets.** The merchant dashboard only ever holds a non-secret
   site reference and frontend-safe status. Credential material is exchanged and stored
   **server-side only** (`apps/api`), encrypted at rest (later).
3. **No raw credential transfer through the contract.** Handshake/health/event/diagnostic
   payloads carry only non-secret metadata, opaque references, and summaries.
4. **Summary-only events.** No raw full order payloads and no full customer PII ever leave the
   site through the event bridge — only minimal, redacted summaries with opaque references.
5. **Diagnostics are redacted.** Every diagnostic string passes through
   `redactPluginDiagnosticText` (see `src/redaction-contract.ts`), which removes passwords,
   application passwords, consumer keys/secrets, API keys, tokens, authorization/bearer/basic
   headers, cookies, nonces, and webhook secrets.
6. **Reserved capabilities are disabled by default.** `mutate_products_later`,
   `mutate_orders_later`, and `send_notifications_later` are never enabled in this phase.
7. **No real writes / mutations** to any store until the mock UI, adapter interfaces, and the
   platform security model are reviewed and approved.

## Runtime security (Plugin PR 2 — secure connection state + read-only bridge)

The installable PHP runtime in this package is bound by these additional rules:

- **No credentials, ever.** The plugin has no forms or settings fields that accept WordPress
  admin/application passwords, WooCommerce consumer keys/secrets, hosting/FTP/cPanel
  credentials, or API secrets. The admin page shows an explicit warning telling operators not
  to paste any such values.
- **No secrets stored.** Only NON-secret, plugin-owned options are persisted:
  `wcos_connection_status`, `wcos_connection_site_id`, `wcos_connection_tenant_id`,
  `wcos_connection_last_checked_at`, `wcos_connection_mode`, and `wcos_plugin_version`. The
  site/tenant identifiers are **locally generated placeholders**, not external IDs. No
  secret/credential/API-key/token options exist.
- **No network calls.** The runtime uses no `wp_remote_post`, `wp_remote_get`, cURL, or any
  outbound HTTP. There is no backend connection and no handshake yet; connection state is
  local-only (`backend_connected` is always `false`).
- **WooCommerce is read-only and local.** The internal `WCOS_WooCommerce` module +
  `WCOS_Read_Bridge` only call read-only WordPress/WooCommerce helpers
  (`wc_get_products`, `wc_get_orders`, `get_users`, `wp_count_posts`, `count_users`,
  `WC_Customer`) to build **summaries**. They never call the WooCommerce REST API, never
  create API keys, never register webhooks, and never write/mutate anything
  (no `save()`, `update_status()`, `set_stock_quantity()`, `wp_insert_post()`, etc.).
  WooCommerce is optional (missing → warning, not fatal).
- **Summaries only — no raw PII.** Read summaries are produced by `WCOS_Data_Sanitizer` and
  never include addresses, phone numbers, raw emails, IPs, user agents, payment details, order
  notes, raw meta, or full line items. Customers are reduced to generic/masked labels; emails
  and phones are masked when ever surfaced. A small max limit (20) is enforced on all lists.
- **REST endpoints are admin-only.** Every `/wcos/v1/*` route requires the `manage_options`
  capability; there is no public/unauthenticated access. Connection POST routes mutate only
  non-secret local options. All responses run through `WCOS_Redaction` as defense-in-depth and
  never expose admin email, usernames, raw customer/order/product records, full server
  environment, secrets, tokens, cookies, nonces, or raw headers.
- **Hardening note.** Routes rely on a capability `permission_callback` (consistent with the
  skeleton). A future PR should add nonce/session hardening for browser-originated calls.
- **Redaction.** `WCOS_Redaction` redacts passwords, application passwords, consumer
  keys/secrets, API keys, tokens, authorization/bearer/basic headers, cookies, nonces, webhook
  secrets, `ck_`/`cs_` prefixes, and (defense-in-depth) `ip_address`/`user_agent` fields.
- **Safe uninstall.** `uninstall.php` removes only the plugin-owned non-secret options; it
  never deletes merchant content, WooCommerce data, products, orders, or customers, and makes
  no external calls.

## Handshake security (designed, not implemented here)

- A **short-lived challenge** issued by the backend; the plugin responds (signed) later.
- **Replay protection** (nonce/expiry) and **idempotency** for webhook delivery — later.
- **Audit logging** of connect/verify/disconnect/revoke — server-side, secrets redacted.
- **Per-site, per-tenant isolation**: one site's connection can never reach another's.

## Webhook security (designed, not implemented here)

- Webhook **signature verification** is mandatory before any state change — later.
- **Idempotency** + **retry/backoff** + **delivery logs** — later.
- The receiver URL lives in the backend; the plugin never trusts unsigned input.

## Disconnect / revoke

- Disconnect must **stop event delivery**, **revoke credential metadata** via the backend,
  **remove webhook registrations** (later), and **clear connection state**.
- **Audit logs are preserved**; merchant data retention follows the platform retention policy
  (later) — disconnect does not silently destroy required records.

## What this package must never contain

- Real activation/uninstall logic, REST endpoints, DB tables, cron jobs, or HTTP calls.
- Any value that is or resembles a real secret/token/key.
- Full customer PII or full order payloads (even as "examples").
- Real domains, real emails, or real phone numbers in examples — use `example-store.test` /
  `merchant-store.example` and obviously-fake placeholders only.
