# Platform Security Model

Spec: `wordpress-commerce-os-platform`

Extends `.kiro/steering/security.md` to the full platform (onboarding, support handover,
events, notifications, AI, billing, webhooks, mutations). These rules are **binding** for
every future phase.

## Hard rules (no exceptions)
1. **No real WooCommerce consumer keys/secrets in the frontend.** Ever.
2. **No WordPress application passwords in the frontend.** Ever.
3. **No production secrets in mobile/web app builds** or in git (code, config, fixtures,
   `.env`).
4. **Credentials are handled only by the backend/proxy (`apps/api`) or the WordPress
   companion plugin** — never entered, transmitted, or cached by the client.
5. **Per-site credential isolation.** Credentials scoped per site + per owning tenant; one
   site's secrets are never reachable from another's context. The client holds only a
   non-secret site reference.
6. **Encryption at rest** for all stored credentials/secrets (backend) — *to implement when
   `apps/api` lands*.
7. **Audit logs** for privileged actions (connect, disconnect, rotate, mutations) with
   who/what/when/target; secrets redacted — *backend phase*.
8. **RBAC** for merchants (owner/manager/staff/viewer) and for internal support/admin —
   modeled early, enforced server-side later.
9. **Webhook signatures must be verified** and events de-duplicated (idempotency) before
   any state change — *webhook phase*.
10. **Support handover must never collect insecure credential sharing inside the app.** No
    chat/form fields for keys/passwords; connection is arranged server-side (proxy issues
    keys, or the companion plugin performs the handshake).

## Privacy & consent (growth layer)
- **SMS/marketing require explicit consent**; every message path requires a working
  **opt-out**. Consent + opt-out state is part of the data model from the start.
- **Customer data privacy must be planned**: PII minimization, retention limits, export/delete
  paths, and processor agreements — documented before any real customer data is ingested.
- Event tracking (search/cart/purchase/etc.) must be consent-aware and avoid storing
  unnecessary PII.

## Onboarding-specific
- **Path A & B store only frontend-safe data** (site URL, business info, brand assets,
  request status). No credentials at any onboarding step.
- Connection (after review/provisioning) uses the secure backend/proxy or companion-plugin
  handshake; the client receives an opaque connection reference only.

## Mutation gating (unchanged, reinforced)
- **No real WooCommerce/WordPress writes** until: mock UI exists, typed adapter interfaces
  exist, and this security model is reviewed/approved. Mutations then run server-side with
  strict permission checks, audit logging, and idempotency.

## Provider integrations
- SMS/AI/billing providers are integrated **server-side** behind adapters; provider API keys
  live only in backend environment configuration, never in the client or git.
