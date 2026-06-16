# Execution Roadmap

Spec: `wordpress-commerce-os-platform`

Implementation order chosen to **minimize rework**: mock UI + data models first, adapter
boundaries next, backend/proxy + real integrations last and only after security review.
Each phase is one or more small, reviewable PRs. Every new domain ships behind a typed
adapter/service seam with a mock implementation.

## Phases

### Phase 0 — Current foundation ✅ (shipped)
App shell · mock auth · active site · dashboard (operational home) · products · orders ·
customers · settings · inventory + fulfillment workflow · Vercel web preview ·
Ecme/Persian/RTL visual pass. Governed by `wordpress-woocommerce-client-dashboard-mvp`.

### Phase 1 — Onboarding platform (mock) — **next**
Existing-Site Onboarding + New-Store-Launch modules · template catalog (mock) · request
status timelines · entry chooser. No real credentials, no provisioning. (See "Next PR".)

### Phase 2 — Support operations (mock)
Internal support/admin queue (mock) · request detail · checklist + status changes (mock) ·
assignment placeholder · delivery/connection handoff placeholder. (Future `apps/admin`.)

### Phase 3 — Subscription plans UI (mock)
Plans: Starter · Growth · Pro · Managed · feature matrix · plan-gate placeholders. No real
billing. Entitlement flags modeled client-side as placeholders.

### Phase 4 — AI Business Advisor (mock)
Advisor chat/panel · store-context summary · sales/product/customer insights · campaign +
product-copy suggestions. Adapter boundary: mock → API provider → local model.

### Phase 5 — Customer intelligence / event model (schema only)
Event taxonomy + schema docs; no real tracking script yet. Taxonomy:
`site_search · product_view · add_to_cart · abandoned_cart · purchase · product_interest ·
back_in_stock_subscription · sms_click · campaign_conversion`. Each event: id, type, siteId,
timestamp, anonymous/customer ref (consent-aware), and typed payload.

### Phase 6 — SMS / back-in-stock automation (mock)
Restock interest list · consent model placeholder · mock campaign rules · mock SMS preview.
Adapters later: mock → Kavenegar → Twilio; email provider later. Consent + opt-out required.

### Phase 7 — Reports / analytics (lightweight)
Sales reports · product performance · customer segments · search-demand report · campaign
performance (mock). RN-svg charts behind a `Chart` wrapper; no heavy chart libs.

### Phase 8 — Backend/proxy skeleton (`apps/api`)
Tenant/site model · auth boundary · credential vault placeholder · per-site isolation ·
WooCommerce proxy interfaces · audit log model. No real secrets initially.

### Phase 9 — WordPress companion plugin contract
Handshake design · site identity · event bridge · webhook configuration · health check ·
connection verification. Contract/spec only unless full plugin is separately scoped.

### Phase 10 — Real WooCommerce read-only integration
Read products/orders/customers/reports · error handling · retry/rate-limit strategy. No
mutations. Flip the existing adapters from `mock` to `http` (backend-backed).

### Phase 11 — Webhook ingestion
Order/product/customer/coupon events · signature verification · idempotency · event log ·
sync status surfaced in the dashboard.

### Phase 12 — Controlled mutations
Update product stock · edit product basics · order status update · fulfillment/tracking ·
customer notes/tags. Strict server-side permission checks + audit + idempotency. Wires the
disabled placeholders already present in Products/Orders/Fulfillment.

### Phase 13 — Real providers
Real SMS provider · real billing provider · real AI provider · advanced automation.

## Feature backlog (priorities)

**P0**
- Store Launch + Existing Site Onboarding (mock)
- Template Catalog (mock)
- Support Queue (mock)
- Subscription Plans UI (mock)

**P1**
- AI Advisor (mock)
- Event tracking model (schema)
- SMS / back-in-stock (mock)
- Reports (lightweight)

**P2**
- Backend/proxy skeleton (`apps/api`)
- WordPress plugin contract
- Real read-only WooCommerce integration

**P3**
- Webhooks
- Controlled mutations
- Real SMS / AI / Billing providers
- Advanced automation

## Next implementation PR (recommended)
**`Store Launch + Existing Site Onboarding + Template Catalog mock`** (Phase 1, P0).

Should include:
- An **entry chooser**: "I already have a WordPress/WooCommerce site" vs "I want you to
  launch a new store for me".
- **Existing-site onboarding form** (site URL, business name, platform confirmation,
  request type) with the **managed handover request** option.
- **New-store-launch form** (domain, business type, template selection, package selection
  placeholder, brand-assets checklist).
- **Template catalog** (mock list with categories/highlights/preview placeholders).
- **Package/subscription selection placeholder** (no billing).
- **Request status timeline** for both paths (the status flows in `onboarding-paths.md`).
- A mock `OnboardingService`/adapter + realistic mock request data; site-aware where
  relevant; loading/empty/error states; Persian/RTL; existing UI primitives.

Constraints: **no real credentials, no real provisioning, no backend.** Mock-only, behind
adapter boundaries, following `security-model.md`.
