# apps/admin — Platform Admin (internal-only)

> **Status: planned app shell (not yet scaffolded).** This README is the architecture spec
> for the internal Platform Admin app. The Platform Admin **mock feature code currently lives
> temporarily in `apps/client/src/features/platform-admin/`** (see that folder's README) and
> must be migrated here. PR #32 was corrected to **remove all merchant-facing exposure** of
> Platform Admin from `apps/client` (no nav entry, no `/platform-admin` route); this README
> captures the destination so the move can be completed in a follow-up with a runnable env.

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
