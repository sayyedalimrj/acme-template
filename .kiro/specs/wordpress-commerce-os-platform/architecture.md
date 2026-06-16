# Future Architecture

Spec: `wordpress-commerce-os-platform`

A target structure for the full platform. **Documented, not created** — folders are added
only when their phase is implemented (see `roadmap.md`). Extends `structure.md`.

```
/                              repo root
├── Theme/                     Ecme reference (DO NOT MODIFY)
├── .kiro/                     steering + specs
├── apps/
│   ├── client/                merchant dashboard (Expo + RN Web) — EXISTS
│   ├── api/                   backend/proxy + orchestration — FUTURE
│   └── admin/                 internal support/operations console — FUTURE
│       (a.k.a. support-admin)
├── packages/
│   ├── shared/                shared TS types/contracts (domain, events, DTOs) — FUTURE
│   └── wordpress-plugin/      WordPress companion plugin (or top-level wordpress-plugin/) — FUTURE
└── services/
    ├── events/                behavior/search/cart/purchase tracking — FUTURE
    ├── notifications/         SMS/email/back-in-stock delivery — FUTURE
    ├── ai/                    advisor, recommendations, content/campaign suggestions — FUTURE
    └── billing/               subscription lifecycle — FUTURE
```

## Responsibilities

| Component | Responsibility | Notes |
| --- | --- | --- |
| **apps/client** | Merchant-facing dashboard: onboarding, catalog, orders, customers, inventory, fulfillment, reports, advisor, automation UI. | Exists today. Talks only to `apps/api` (never directly to stores for privileged ops). |
| **apps/api** | Auth, tenant + site model, **credential proxy/vault**, billing orchestration, WooCommerce proxy, webhook ingestion, audit log, RBAC. | Holds all secrets. Single trust boundary for store access. |
| **apps/admin** (support) | Internal operations queue: onboarding requests, provisioning checklists, assignment, connection/delivery handoff. | Staff-only; separate auth + permissions. |
| **packages/wordpress-plugin** | Companion plugin: secure site connection handshake, event bridge, webhook config, health check, optional managed companion. | Server-to-server; performs connection without exposing secrets to the frontend. |
| **packages/shared** | Shared TypeScript types/contracts: domain models, event schemas, request DTOs, plan/feature matrix. | Keeps client/api/admin in sync; single source of truth for contracts. |
| **services/events** | Ingest + store behavior events (search, view, cart, purchase, interest, back-in-stock, SMS click, conversion). | Feeds intelligence, advisor, automation. |
| **services/notifications** | SMS/email/back-in-stock delivery with consent + opt-out. | Provider adapters (mock → Kavenegar/Twilio/email). |
| **services/ai** | AI Business Advisor, recommendations, product copy + campaign suggestions. | Adapter: mock → API provider → local model. |
| **services/billing** | Subscription lifecycle: plans, upgrades, invoices, dunning, entitlements. | Adapter: mock → real provider. Entitlements gate features. |

## Cross-cutting architecture principles
- **Tenant → Site → Resource** hierarchy everywhere; the client only ever holds a non-secret
  site reference (the active-site id), and all privileged data flows through `apps/api`.
- **Adapter boundaries** for every external concern (Woo/WP, SMS, AI, billing, events):
  `mock → real`. The client never imports provider SDKs; it calls services that resolve an
  adapter from config (mirrors the existing `getAdapters()` factory).
- **Contracts in `packages/shared`** so `client`, `api`, and `admin` evolve without drift.
- **Cross-platform**: `apps/client` keeps Expo/RN/Web/Android/iOS rules (`tech.md`); backend
  and services are server-side and unconstrained by RN rules.
- **Plan entitlements** computed server-side (`apps/api`/`services/billing`); the client only
  receives entitlement flags and renders gates — never trusts client-side gating for access.
- **Companion plugin vs proxy** are complementary: the proxy works for any reachable store
  with issued keys; the plugin enables richer, push-style integration (events, webhooks,
  health) for managed/launched stores.
