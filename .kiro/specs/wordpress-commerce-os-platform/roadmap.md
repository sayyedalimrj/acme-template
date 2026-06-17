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

### Phase 1 — Onboarding platform (mock) ✅ (shipped)
Existing-Site Onboarding + New-Store-Launch modules · template catalog (mock) · request
status timelines · entry chooser. No real credentials, no provisioning.

### Phase 2 — Support operations (mock) ✅ (shipped)
Internal support/admin queue (mock) · request detail/review · checklist/playbook + status
changes (mock, in-memory) · assignment placeholder · internal notes · risk/handoff
warnings · delivery/connection handoff placeholder. (Future `apps/admin`.)

### Phase 3 — Subscription plans UI (mock) ✅ (shipped)
Plans: Starter · Growth · Pro · Managed · feature matrix · plan-gate placeholders. No real
billing. Entitlement flags modeled client-side as placeholders.

### Phase 4 — AI Business Advisor (mock) ✅ (shipped)
Advisor chat/panel (deterministic mock) · store-context summary · insights · review-only
recommendations (sales/inventory/marketing/content/media) · prompt chips. No real AI
provider/API; every suggestion is review-only. Adapter boundary: mock → API provider →
local model.

### Phase 4b — AI Product Media Studio (mock) ✅ (shipped)
Mock product-media workflow: product selector · simulated source-image quality analysis ·
task chooser (improve/repair/background/lifestyle/hero/ad/video/storyboard/resize/alt-text) ·
placeholder output variants · promo-video/storyboard concepts. Review-only; no real
image/video generation, no upload, nothing published. Adapter: mock → API provider →
local/on-device model.

Planned capabilities (all **mock-first**, provider-gated later):
- Improve low-quality product photos; remove/replace background; produce clean
  marketplace-ready product images.
- Create lifestyle/hero product images and social-media ad creatives.
- Generate short product promo videos.
- Use an uploaded product photo as a **reference** (works even when the source is low
  quality or messy, with clearly stated limitations).
- Output **suggestions only** — the merchant must approve before any asset is used or
  published.

Architecture (documented now, built later):
- **`MediaStudioService`** + **`MediaStudioAdapter`** following the existing service/adapter
  seam: `mock → API provider → local/on-device model (if feasible)`.
- **Product context** passed to generation: product title, SKU, category, brand, price,
  target audience, campaign goal.
- **Asset safety:** no copyrighted/template assets; **no automatic publishing without
  merchant approval**; generated-asset metadata stored later (provenance, source image
  reference, approval state). Real image/video generation is **out of scope** until the
  provider integration phase and a content-safety review.

### Phase 5 — Customer intelligence / event model (mock) ✅ (shipped)
Mock event taxonomy + stream and derived signals (search demand, product interest,
back-in-stock, abandoned carts, campaign conversion) + intelligence summary + review-only
recommendations + a dev/mock event recorder. No real tracking/cookies/analytics provider.
Taxonomy: `site_search · product_view · add_to_cart · remove_from_cart · begin_checkout ·
purchase · abandoned_cart · product_interest · back_in_stock_subscribe · sms_click ·
campaign_click · campaign_conversion · product_restocked · page_view · unknown`.

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
- AI Product Media Studio (mock) — product photo/video generation & repair (Phase 4b)
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
Phases 1 (onboarding), 2 (support operations), 3 (subscription plans), 4 (AI Business
Advisor), 4b (AI Product Media Studio), and 5 (Customer Intelligence / event model) are
shipped. The recommended next PR is **`SMS and Back-in-stock automation mock`** — a mock
opt-in/consent model, back-in-stock interest list, mock campaign rules, and an SMS preview,
fed by the customer-intelligence signals. No real SMS sending.

Constraints (unchanged): **no real credentials, no real billing, no real provisioning, no
real AI/media generation, no real tracking/PII pipeline, no real SMS/email send, no backend.**
Mock-only, behind adapter boundaries, following `security-model.md`. Any messaging requires
explicit opt-in/opt-out.
