# Product Vision — WordPress Commerce Operating System

Spec: `wordpress-commerce-os-platform`

> Strategy/planning document. No implementation. Phase 0 (shipped) is governed by the
> `wordpress-woocommerce-client-dashboard-mvp` spec; this spec defines the platform around
> and beyond it.

## What we are building

A **WordPress Commerce Operating System** — a SaaS platform that lets merchants operate a
WordPress/WooCommerce business entirely from our dashboard, whether they bring an existing
store or have us launch a new one. We replace day-to-day `wp-admin` work with a faster,
safer, growth-oriented operating surface, and we sell it as a subscription.

The platform is five businesses in one product:
1. **Merchant dashboard (SaaS).** Operate catalog, orders, customers, inventory,
   fulfillment, reports — the current `apps/client`.
2. **Managed store launch service.** We provision a WordPress/WooCommerce store on the
   customer's domain/hosting from a chosen template + package, then connect it.
3. **Existing-site handover/connection service.** Connect a live store, or have our team
   review/support/hand it over.
4. **Growth / AI / automation layer.** AI Business Advisor, customer intelligence + event
   tracking, SMS/back-in-stock, campaign automation.
5. **Subscription business.** Tiered plans (Starter / Growth / Pro / Managed) with feature
   gating and billing.

## Who the users are
- **Merchants (primary).** Operate one or more stores from the dashboard.
- **Our support/operations team (internal).** Process onboarding requests, provision/connect
  stores, and run a managed-operations queue (internal `apps/admin`).
- **Merchants' end-customers (shoppers).** Never use this app; they use the public store.

## Why now / why this shape
- WordPress/WooCommerce powers a huge share of stores, but `wp-admin` is slow, fragmented,
  and intimidating. A focused operating layer + managed launch is a strong wedge.
- Mock-first, adapter-bounded development lets us validate UX and data models before paying
  the cost (and risk) of real credentials, backends, and provider integrations.

## Product pillars
- **Two front doors** (connect existing / launch new) → one operating dashboard.
- **Secure by construction** — credentials never touch the frontend (see `security-model.md`).
- **Growth built in** — advisor, events, automation as first-class, not bolt-ons.
- **Cross-platform** — Web first, Android/iOS viable from the same Expo codebase.
- **Subscription-aligned** — features map to plans; gating is modeled early, enforced later.

## Relationship to existing specs
- `wordpress-woocommerce-client-dashboard-mvp` — the shipped Phase 0 dashboard (kept as-is).
- This spec — the platform vision, onboarding, architecture, security model, and roadmap
  (Phases 1–13) that future PRs follow.
