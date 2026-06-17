# Companion Plugin — Connection & Data-Flow Contract

> Contract overview only. The data flow below is **not** implemented yet; it describes the
> intended, security-reviewed flow so `apps/api`, `apps/client`, and the plugin stay aligned.
>
> **Implementation status:** the installable PHP runtime now includes the skeleton + admin
> status page + health + internal WooCommerce detection (PR 1), non-secret local connection
> state + a read-only summarized WooCommerce bridge (PR 2), and a local-only summary event
> bridge + webhook delivery placeholder + disabled controlled-actions + local audit (PR 3).
> A **read-only sync foundation** builds a redacted, summary-only **sync package** with a
> **local delivery preview** (delivery disabled by default, no network), and a **signed
> delivery foundation** adds a **signed preview shape** plus a backend, framework-agnostic
> **signed-delivery handler** that verifies an HMAC-SHA256 signature (with **injected** signing
> material) + a replay/timestamp window and then ingests an in-memory snapshot. The plugin
> stores **no signing secret** (status `not_configured`). It still performs **no** real backend
> delivery, real handshake, credential handling, WooCommerce REST/API-key calls, real webhooks,
> mutations, server runtime, or persistence. The recommended next step is a **controlled dev
> delivery endpoint + read-only sync persistence**.

## Actors

- **Merchant dashboard** (`apps/client`) — holds only a non-secret site reference; never sees
  store credentials.
- **Backend / proxy** (`apps/api`) — single trust boundary; holds credential metadata (and,
  later, encrypted secrets); issues short-lived connection references.
- **Companion plugin** (this package, future) — runs inside the merchant's WordPress site;
  performs the server-to-server handshake and reports identity/health/events.

## High-level flow (future)

```
client                backend (apps/api)                 companion plugin (WordPress site)
  │                          │                                      │
  │  request connect site    │                                      │
  ├─────────────────────────►│                                      │
  │                          │  connection intent (intentId,        │
  │                          │  requested read capabilities)        │
  │                          ├─────────────────────────────────────►│
  │                          │                                      │  collect site identity +
  │                          │                                      │  capability snapshot (no secrets)
  │                          │  handshake request (identity +       │
  │                          │  capability snapshot)                │
  │                          │◄─────────────────────────────────────┤
  │                          │  short-lived challenge (placeholder) │
  │                          ├─────────────────────────────────────►│
  │                          │  signed challenge response (later)   │
  │                          │◄─────────────────────────────────────┤
  │                          │  verify (later) → site connected     │
  │   connection reference   │                                      │
  │◄─────────────────────────┤                                      │
  │                          │  health checks / event bridge /      │
  │                          │  webhook config (later)              │
```

Key properties:

- The **client never holds secrets**; it only initiates intent and later sees a connection
  reference + frontend-safe status.
- Credential material (WP application password / WooCommerce keys) is exchanged and stored
  **server-side only**, never surfaced to the client and never committed to git.
- The handshake uses a **short-lived challenge** (designed later) with **replay protection**
  and **audit logging** — none of which is implemented in this PR.

## Contract modules

| Module                       | Defines                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `plugin-metadata.ts`         | Plugin identity, version, supported features, declared capabilities.      |
| `site-identity.ts`           | Safe site/WordPress/WooCommerce environment + capability snapshot.        |
| `handshake-contract.ts`      | Connection intent, handshake request/response, challenge, statuses.       |
| `health-check-contract.ts`   | Health check report + item/severity/status taxonomy.                      |
| `event-bridge-contract.ts`   | Event envelope, types, source, **summary-only** payload, delivery status. |
| `webhook-config-contract.ts` | WooCommerce webhook plan, topics, registration status, delivery policy.   |
| `capabilities-contract.ts`   | Companion capabilities, required WP/WooCommerce capabilities, checks.     |
| `disconnect-contract.ts`     | Disconnect/revoke request/result, reasons, cleanup actions.               |
| `redaction-contract.ts`      | Diagnostic report shape + redaction rules + `redactPluginDiagnosticText`. |

## Alignment with backend (`apps/api`)

These names are kept compatible (by convention, not by import):

- `SiteId`, `TenantId` — opaque string references.
- Capability names (`read_products`, `read_orders`, `read_customers`, `read_reports`,
  `receive_webhooks`, `mutate_*_later`, `send_notifications_later`) mirror
  `SiteConnectionCapability`, plus plugin-only `site_health` and `sync_events`.
- Event/webhook topics mirror the backend `WebhookEventType`.
- Credential kinds referenced for context mirror `CredentialKind` (metadata only).
- Disconnect/handshake/diagnostic actions map onto backend `AuditAction` values.

A future `packages/shared` is the intended home for the single, unified source of truth.
