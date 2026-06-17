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
