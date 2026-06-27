# Companion Plugin — Connection & Data-Flow Contract

> **Status: production transport implemented.** The runnable backend is `services/api` (not `apps/api`).
> Merchant portal is `apps/client`. This document describes the **live** signed plugin flow.

## Actors

- **Merchant dashboard** (`apps/client` @ `https://app.jet-web.ir`) — initiates plugin connection; receives one-time `signingSecret`; never sees store WooCommerce keys.
- **Backend API** (`services/api` @ `https://api.jet-web.ir`) — verifies HMAC, stores read-models, issues signing secrets via credential vault.
- **Companion plugin** (`wordpress-plugin/`) — runs on merchant WordPress; reads WooCommerce locally; pushes signed chunks + events.

## Connection flow (implemented)

```
Merchant portal                    services/api                         WordPress plugin
      │                                 │                                      │
      │ POST /merchant/sites/connect/start (mode=plugin)                      │
      ├────────────────────────────────►│                                      │
      │◄ siteId, tenantId, deliveryBaseUrl, signingSecret (once)              │
      │                                 │                                      │
      │  (merchant pastes into WP)    │                                      │
      │                                 │◄──── POST /plugin/handshake (HMAC) ──┤
      │                                 │──── connected ────────────────────────►│
      │                                 │◄──── POST /plugin/sync (chunks) ───────┤
      │                                 │◄──── POST /plugin/events ──────────────┤
      │                                 │◄──── POST /plugin/health ──────────────┤
      │ GET /merchant/sites/:id/status  │                                      │
      ├────────────────────────────────►│  synced counts + plugin last_seen    │
```

## Signed request contract

Canonical base string (newline-separated):

```
siteId
tenantId
timestamp   (ISO-8601 UTC)
nonce       (UUID, single-use)
pluginVersion
sha256_hex(exact_raw_json_body)
```

`signature = HMAC-SHA256(base, signingSecret)` as lowercase hex.

## Sync envelope

- `wcos.sync.v1` — legacy flat envelope (still accepted).
- `wcos.sync.v2` — chunked sync with `syncRunId`, `chunk.entity`, `chunk.chunkNumber`, `chunk.isFinal`.

Entities: categories, products (with variations), orders, customers, coupons, optional attributes/brands/tags.

## Security

- Timestamp skew: ±300s (configurable via `PLUGIN_TIMESTAMP_SKEW_SECONDS`).
- Nonce replay: Postgres `replay_nonce` table, unique `(site_id, nonce)`.
- Revoked/disconnected sites and wrong tenant headers are rejected.
- Signing secret rotatable via `POST /merchant/sites/:id/plugin/rotate-secret` (returned once).

## Non-goals (unchanged)

- Plugin does not create WooCommerce REST API keys.
- Plugin does not mutate WooCommerce data unless controlled actions are explicitly enabled later.
- Merchant dashboard never receives raw signing secret after initial display.

See also `README.md`, `SECURITY.md`, and `services/api/src/http/routes/plugin.ts`.
