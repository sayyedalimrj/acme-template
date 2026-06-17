# apps/admin — Platform Admin + Workflow Operations (internal-only)

> **Status: scaffolded (mock-only).** This is the internal admin app — a standalone Expo +
> React Native Web app that **deploys separately** from the merchant app (`apps/client`). It
> is **internal-only** and must never appear on the merchant domain. The Platform Admin mock
> was **migrated here from `apps/client`** (the merchant app no longer contains any
> platform-admin code, route, or nav entry). All data is mock-only; real data will arrive via
> `apps/api` + the platform DB, behind **strict RBAC** (not built yet).

## Implemented in this PR

- Standalone app shell (`app/_layout.tsx` + `AdminShell`) with a top nav (Overview /
  Workflows) and an en/fa locale toggle (RTL-aware).
- **Platform Admin overview** (`/`): KPI strip, filterable customer-health list, next admin
  tasks, site/sync health, subscription breakdown, recent security/audit, usage/limits,
  support summary.
- **Customer/tenant detail** (`/customers/[id]`): profile, subscription, sites + plugin/sync
  health, support/admin tasks, security signals, usage, internal-notes placeholder, disabled
  mock actions, not-found state.
- **Workflow Operations board** (`/workflows`): KPI strip, priority/type filters, columns
  (backlog/todo · in progress · waiting/blocked · review · done) of compact workflow cards.
- **Workflow detail** (`/workflows/[id]`): meta, customer/site, checklist, timeline, related
  security signals, next action, blocked reason, internal notes, **future automation
  readiness** (trigger/condition/action labels only — no engine), disabled mock actions.
- A small self-contained UI kit (`src/ui.tsx`), theme + i18n + formatters (`src/system.tsx`,
  `src/labels.ts`), mock data, in-memory services, and focused tests.

## Why a separate app

Platform Admin is the control surface for **our own team**, not for merchant customers. It must
be **deployed separately** from the merchant dashboard and must never appear in the merchant
app's navigation or routes. Mixing it into `apps/client` is an access-control and product
boundary violation.

## Four-surface architecture

| Surface            | Audience              | Responsibility                                                        |
| ------------------ | --------------------- | --------------------------------------------------------------------- |
| `apps/client`      | Merchants / store owners | Store operations, products, orders, reports, onboarding, growth.   |
| `apps/admin`       | **Our internal team** | Manage tenants/customers, sites, subscriptions, support, plugin/sync health, security/audit, usage limits, internal tasks. |
| `apps/api`         | Backend               | Proxy + **platform database** boundary; RBAC, audit, signed delivery. |
| `wordpress-plugin` | Customer WP sites     | The single WordPress Commerce OS Companion that connects a store and emits sync/security signals. |

**Data flow (target):** `wordpress-plugin` → `apps/api` (signed delivery) → **platform DB** →
`apps/admin` reads aggregated tenant/site/health data. `apps/admin` **never** connects directly
to a customer's WordPress/WooCommerce database.

## Security (binding)

- **Internal-only.** Will require **strict RBAC / least-privilege** before any real data.
- No direct connection to customer WordPress databases.
- No real PII, no secrets, no WooCommerce credentials, no plugin signing secrets.
- No real billing, no real auth, no external APIs in the mock phase.
- All current data is **mock-only**; real data arrives via `apps/api` + the platform DB.

## Planned app shell (Option A target)

A standalone Expo + React Native Web app (mirrors `apps/client` config so it stays
Web + Android + iOS capable), independent `package.json`/`node_modules` (apps are not a
workspace monorepo today):

```
apps/admin/
  package.json            # name "@acme/admin", expo-router entry (mirror apps/client)
  app.json                # slug "ww-admin-dashboard", scheme "wwadmin"
  tsconfig.json           # extends expo/tsconfig.base; "@/*" -> "./src/*"
  babel.config.js metro.config.js eslint.config.js .gitignore expo-env.d.ts
  app/
    _layout.tsx           # providers (QueryClient, Theme, I18n) + Stack
    index.tsx             # internal admin overview
    tenants/[id].tsx      # tenant/customer detail
  src/
    domain/types.ts       # Platform* types (move from client)
    mock/platformAdmin.ts # mock tenants/sites/signals/tasks/usage (move from client)
    services/platformAdminService.ts  # in-memory mock service (no adapter factory needed)
    features/platform-admin/ ...screens + helpers
    ui/                   # minimal local UI kit OR import from a shared package (below)
```

### What to move from `apps/client`

All of `apps/client/src/features/platform-admin/**`, the `Platform*` types appended to
`apps/client/src/domain/types.ts`, `apps/client/src/mock/data/platformAdmin.ts`, the
`platformAdminService` + query keys, and the `mockPlatformAdminAdapter` (collapse into a
direct in-memory service in admin). The Platform Admin **i18n keys** can move too, or stay if
admin reuses the shared i18n package.

## Future shared-package extraction

To avoid duplicating the design system across `apps/client` and `apps/admin`, extract shared
code into packages (introduce a workspace, e.g. npm/pnpm workspaces, at that point):

- `packages/ui` — shared UI primitives (`Card`, `Text`, `Badge`, `StatusBadge`,
  `HealthScoreBadge`, `MetricCard`, `ChartCard`, `MiniBars`, `DataListRow`, `SegmentedControl`,
  `MockActionButton`, `Screen`, theme tokens).
- `packages/types` — shared domain types (including the `Platform*` types).
- `packages/formatters` — shared locale-aware money/number/date formatters.

Until then, `apps/admin` should **duplicate only the minimal UI it needs** and import nothing
from `apps/client` (no cross-app path coupling).


## Deployment (separate from the merchant app)

This app deploys as its own **separate Vercel project** (or any static host), **never** on the
merchant domain. This is a separate internal admin app — it is **not** a route inside
`apps/client`.

- **Vercel Project Root Directory:** `apps/admin`
- **Build command:** `expo export -p web` · **Output directory:** `dist` · **Framework:** none
- SPA fallback rewrite is configured in `apps/admin/vercel.json`.
- **Suggested domain:** internal admin `admin.<domain>` (merchant app stays on `app.<domain>`,
  API on `api.<domain>`). Do **not** expose `apps/admin` under the merchant dashboard domain,
  and do **not** deploy it as a route inside `apps/client`.
- **Internal-only:** access must be gated by **real RBAC / auth (least privilege)** before any
  real (non-mock) data.

## Local validation

```
cd apps/admin
npm run typecheck && npm run lint && npm run format && npm run test:ci && npm run export:web
```


## Support Inbox (internal, mock-only)

Routes: `/support` (inbox) and `/support/[id]` (conversation). Our team triages SaaS-customer
conversations with the **Customer Context Panel** beside each thread (plan, sites, plugin/sync
health, open workflow tasks, subscription, usage, recent security signals).

**Data access policy (future RBAC):**

- Support agents see **safe summaries** by default.
- **Billing** details require billing permission later (shown flagged, not exposed).
- **Security/audit** details require security permission later (shown flagged, not exposed).
- **Secrets** and signing material are **never** shown.
- Raw synced customer **PII is not shown**.
- **Direct WordPress database access is forbidden.**

Mock-only: no real chat/email/WhatsApp/phone provider, no message sending, no persistence, no
notifications, no external APIs. All reply/assign/resolve/escalate actions are disabled mocks.
