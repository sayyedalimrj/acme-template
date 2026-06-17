# Platform Admin (TEMPORARY — internal-only, to migrate to `apps/admin`)

> **This is internal-only code that must NOT ship in the merchant app.** It is parked here
> only until it can be moved to the dedicated internal admin app at **`apps/admin`** (see
> `apps/admin/README.md`).

## Current state (after the PR #32 architecture correction)

- **No merchant exposure:** there is **no `/platform-admin` route** in `apps/client/app` and
  **no entry in the merchant navigation** (`src/components/layout/navigation.ts`). A navigation
  test asserts no `/platform-admin` merchant route can be added back.
- The mock feature code (types, mock data, service, query keys, hooks, helpers, screens,
  tests) remains in `apps/client` **dormant and unrouted** to keep the change small and the
  data model intact for a clean move.
- Everything is **mock-only**: no backend, no real billing, no real auth, no external APIs, no
  PII/secrets, and **no connection to customer WordPress databases**.

## Why it lives in a separate app

Platform Admin is the control surface for **our team**, not merchant customers. It must be
**deployed separately** and gated by **strict RBAC / least privilege**. Real data will come
from the platform database (populated by `apps/api` + the `wordpress-plugin` signed sync), not
from direct customer-DB access.

## Migration checklist (next PR)

1. Scaffold `apps/admin` (Expo + RN Web) per `apps/admin/README.md`.
2. Move `domain/types.ts` `Platform*` block, `mock/data/platformAdmin.ts`,
   `services/platformAdminService.ts` (+ query keys), `adapters/mock/mockPlatformAdminAdapter.ts`
   (collapse into an in-memory service), and this `features/platform-admin/**` into `apps/admin`.
3. Provide a minimal admin UI kit (or extract `packages/ui` / `packages/types` /
   `packages/formatters`).
4. Delete this folder and the `platformAdmin*` additions from `apps/client`.
