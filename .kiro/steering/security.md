---
inclusion: always
---

# Security Steering — Credentials & Site Connections

WooCommerce consumer keys, consumer secrets, and WordPress application passwords are
**high-value, long-lived, write-capable credentials**. They are **not** ordinary frontend
settings. Mishandling them can expose a client's entire store (orders, customer PII,
inventory, refunds). This file is binding for all current and future work.

## Data classification

### Frontend-safe data (may live on the client / in app state)
- Site display name, site URL/domain (public), site logo/branding.
- Connection **status** (connected / disconnected / error) and last-sync timestamps.
- Non-secret site metadata (store currency, timezone, WooCommerce/WP version).
- A **connection/session reference** (opaque id or short-lived token) issued by our
  backend/proxy — never the underlying store credentials.
- User UI preferences (theme, language, RTL).

### Sensitive credentials (MUST be handled by a backend/proxy, never the frontend)
- WooCommerce **consumer key** and **consumer secret**.
- WordPress **application passwords** and any WP admin credentials.
- OAuth client secrets, refresh tokens, or any long-lived store-write credential.

## Production requirement: backend/proxy layer

- In production, the frontend **must not** hold or transmit raw store credentials.
- All privileged WooCommerce/WordPress API calls go through **our backend/proxy** which:
  - stores credentials encrypted at rest (per-site),
  - signs/authorizes outbound store requests server-side,
  - returns only frontend-safe data and results to the app,
  - issues the app a short-lived, revocable session/connection reference.
- The frontend talks to **our backend**, not directly to each client's store, for any
  operation requiring secrets.

## Per-site credential isolation

- Credentials are scoped per connected site and per owning client/tenant.
- One site's credentials must never be reachable from another site's context.
- The active-site context in the app carries only a non-secret site id/reference.

## Revocation / disconnect flow

- Disconnecting a site must revoke/delete the stored credentials server-side and
  invalidate any session/connection reference.
- Revocation must be immediate and auditable; the UI reflects the new status.
- Document a clear "rotate credentials" path for compromised keys.

## Audit & logging expectations

- The backend/proxy logs privileged actions: connect, disconnect, credential rotation,
  and write operations (order status change, product create/edit/delete) — with who,
  what, when, and target site.
- Logs must **never** contain secret values; redact keys/secrets/passwords.
- Surface a user-visible activity/audit trail where appropriate (frontend-safe view).

## Hard rules (no exceptions)

- **No secrets in git.** No keys, secrets, or app passwords committed to the repository
  in any form (code, config, fixtures, `.env` checked in).
- **No secrets in frontend builds.** Nothing sensitive baked into the Expo/RN Web bundle
  or shipped to the client device/browser.
- **No insecure production credential storage.** No `localStorage`, plain `AsyncStorage`,
  cookies, or in-memory persistence of raw store credentials in the frontend.
- **Mock/dev credentials only when explicitly marked non-production.** During MVP the app
  uses mock services and clearly-labeled non-production placeholders; these must never be
  used against a real store and must never resemble real secrets.
- **No real WooCommerce/WordPress writes** until the mock UI, adapter interfaces, and this
  security model have been reviewed and approved.

## MVP posture

- MVP runs entirely on **mock services** behind adapter interfaces.
- The "Connect site" flow in the MVP captures site URL and **explains** the backend/proxy
  requirement; it does not accept or persist real production secrets in the frontend.
- Settings must display **security warnings** wherever credentials are referenced.
