# Production Execution Plan (Phases 2–8 → real product)

Spec: `wordpress-commerce-os-platform` · companion to `roadmap.md`

This is the **definitive, ordered plan** to take the project from "mock UI behind adapter
boundaries" to a **real, paid, multi-tenant SaaS** — kept read-only (no store mutations) until
the relevant phase and a security review. It maps the requested phases onto small, reviewable
PRs. Every new capability ships behind the existing typed **adapter/service seam** (mock →
backend-backed `http`), so screens do not change when real data arrives.

Binding principles (unchanged): **no secrets in the frontend or in git**; config comes from the
**environment** (12-Factor); **tenant isolation is default-deny and enforced server-side**
(OWASP multi-tenant guidance); destructive/real writes are gated on a security review
(OWASP ASVS as the control checklist).

---

## Definitive order (each ≈ one PR unless noted)

| # | PR | Outcome | Phase (user) |
|---|----|---------|--------------|
| 1 | Finalize/Merge **PR #44** + this turn's PR | Visual + nav + auth/messenger fixes shipped | 1 |
| 2 | **Client visual QA** (only if needed) | Pixel/RTL polish from manual review | 1 |
| 3 | **Database adapter boundary** | `DatabaseAdapter` interface + dev (in-memory/SQLite) impl behind the existing migration manifest/schema; repositories defined as interfaces | 2 |
| 4 | **Real DB connection + repositories** | Managed Postgres wired via env; real repos for `tenants/sites/sync/products/orders/customers`; **tenant isolation runtime** (default-deny, tenant scoping on every query) | 2 |
| 5 | **Auth + RBAC** | Real auth + sessions; roles `owner/manager/staff/viewer/support_admin/system`; permission checks per tenant/site; **admin and client fully separated**; audit log for sensitive access | 3 |
| 6 | **Plugin real signed delivery** | Plugin posts to the real backend URL (env config); signed requests (HMAC); replay protection + idempotency; persist `sync_run`; connection status in Admin; **no secret in frontend** | 4 |
| 7 | **Admin reads real data** | Admin customers/tenants/sites/plugin-health/sync-errors/support-context/workflow board from the real API | 5 |
| 8 | **Client reads real data** | Products/orders/customers/payments from the real API; real no-data / disconnected / error states; **still read-only, no mutation** | 6 |
| 9 | **Billing + usage limits** | Subscription model (`trial/active/past_due/canceled`); plan enforcement; usage limits; invoice metadata; real payment **after** auth + tenant model | 7 |
| 10 | **Production hardening** | env config, monitoring/logging, error tracking, backup/restore, rate limiting, security review, staging/production separation, smoke tests, rollback | 8 |

> **PR budget (matches the estimate):** Demo/Pilot = PRs 1–2 · Read-only MVP = PRs 1–8 ·
> Paid production (no mutation) = PRs 1–10. Mutations + real AI/SMS are a later, separate track.

---

## Phase 2 — Real data (PRs 3–4)

**Database adapter boundary (PR 3).**
- Add `apps/api` `DatabaseAdapter` + per-aggregate **repository interfaces**
  (`TenantRepository`, `SiteRepository`, `SyncRunRepository`, `ProductReadRepository`,
  `OrderReadRepository`, `CustomerReadRepository`). Read models are the redacted, summary-only
  shapes already defined by the sync foundation.
- Provide a **dev storage implementation** (in-memory or local SQLite) behind the **same
  migration manifest/schema** already designed (`001`–`004`). No production DB yet.
- All repository methods take a `TenantContext { tenantId, siteId?, actor }` first argument;
  there is **no un-scoped read path**.

**Real DB + repositories + tenant isolation runtime (PR 4).**
- **DB choice:** managed **PostgreSQL** (Neon/Supabase/RDS-class) — relational integrity, row
  filtering, JSONB for summaries, mature backups. Connection comes from `DATABASE_URL` (env).
- Implement the repositories against Postgres (parameterized queries / a thin query layer; no
  raw string interpolation).
- **Tenant isolation runtime (the critical control):**
  - Default-deny: every query is filtered by `tenant_id` (+ `site_id` where applicable) derived
    from the authenticated context, never from client input.
  - Enforce at two layers: (a) repository layer always injects the tenant predicate; (b)
    Postgres **Row-Level Security** policies as defense-in-depth.
  - A shared test asserts **cross-tenant reads return nothing** for every repository.
  - Audit any access that crosses the expected tenant/site scope.

## Phase 3 — Auth & access (PR 5)

- Real authentication (the existing OTP entry/verify UI stays; the backend issues the code via
  the SMS provider — see `sms-ippanel-integration.md` — and verifies it) + real server sessions
  (httpOnly, rotation, expiry). **No secrets/tokens in the bundle.**
- **Roles:** `owner`, `manager`, `staff`, `viewer`, `support_admin`, `system`.
- **Permissions per tenant/site:** a membership table (`user × tenant × role`) drives a
  `can(actor, permission, scope)` check enforced server-side on every endpoint.
- **Admin vs client separation:** `apps/admin` and `apps/client` are distinct deployments with
  distinct auth audiences; `support_admin`/`system` exist only on the admin side; a client user
  can never reach admin scopes.
- **Audit:** append-only audit entries for sensitive access (cross-tenant support views,
  credential metadata, billing, security signals), per the schema's `audit_logs`.
- Use **OWASP ASVS** as the verification checklist for this PR (session mgmt, access control,
  input handling, error/logging).

## Phase 4 — Plugin signed delivery (PR 6)

- Plugin reads the backend URL + connection id from **non-secret local config**; the signing
  key is provisioned during the handshake and stored **only** plugin-side (never shipped in any
  frontend bundle).
- **Signed requests:** HMAC-SHA256 over `(timestamp, nonce, body)`; backend verifies signature,
  a **timestamp window** (replay protection), and a **nonce/idempotency-key** store
  (idempotent ingest — re-delivery is a no-op).
- Persist each delivery as a `sync_run` (status, counts, errors); surface **connection status +
  last sync + errors** in Admin (PR 7).

## Phase 5 — Admin real data (PR 7)
Flip admin services from mock to the real API: tenants/customers, their sites, plugin health,
sync errors, support context, and the workflow board (wired to real tasks). Read-only.

## Phase 6 — Client real data (PR 8)
Flip the client adapters (`products/orders/customers`) from `mock` to backend-backed `http` via
`appConfig.dataSource` (env). Build payments from real orders/payments. Implement real
**no-data / disconnected (plugin not connected) / error** states. **Still read-only.**

## Phase 7 — Billing & usage (PR 9)
Real subscription model + lifecycle (`trial → active → past_due → canceled`), plan enforcement
(gate features by entitlement), usage limits (sites/sync volume/SMS), and invoice metadata.
Wire a real payment provider **only after** auth + tenant model are in place. No card data in
our DB beyond provider references.

## Phase 8 — Production hardening (PR 10)
- **Config from env, never in repo** (12-Factor): a documented env contract; secret manager in
  prod; `.env.example` with names only.
- Monitoring/logging (structured, tenant-tagged, PII-redacted), error tracking (Sentry-class),
  rate limiting (per-IP + per-tenant), backup/restore + tested restore drill, **staging vs
  production** separation, smoke tests post-deploy, and a written rollback plan.

---

## Cross-cutting guardrails
- One styling system; RN primitives only; Web/Android/iOS parity preserved.
- Adapter/service seam for every new domain; screens never call `fetch`/DB directly.
- Mocks stay as the default `dataSource` until each `http` adapter + security review lands.
- `Theme/` remains untouched; the WordPress plugin lives only in `wordpress-plugin/`.
