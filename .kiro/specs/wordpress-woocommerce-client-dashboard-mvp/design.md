# Design — WordPress/WooCommerce Client Dashboard (MVP)

Spec: `wordpress-woocommerce-client-dashboard-mvp`

> Design-first document. No implementation code is produced in the steering+spec PR.
> The Expo app is created later, in a dedicated implementation PR.

## 1. Overview & goals

A cross-platform, production-grade dashboard our clients use to manage their own
WordPress/WooCommerce stores. Built **React Native first** (Expo + RN + React Native Web,
TypeScript, Expo Router). Web ships first; Android/iOS remain viable without a rewrite.

Design priorities, in order: **cross-platform correctness → security → maintainability →
UX polish (Ecme-inspired)**.

The MVP runs on **mock services behind adapter interfaces**, so the entire UI can be built
and reviewed before any real store integration. Ecme (`Theme/TypeScript/main`) is a
visual/structural reference only and is never modified or ported.

## 2. High-level architecture

Layered, feature-first architecture with strict separation:

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation: Expo Router routes + feature screens           │
│  (RN primitives only; design-system components)               │
├──────────────────────────────────────────────────────────────┤
│  State: Zustand stores (session, theme, ui, activeSite)       │
│         + TanStack Query (server-state cache)                 │
├──────────────────────────────────────────────────────────────┤
│  Services: per-domain service wrappers (products, orders, …)  │
├──────────────────────────────────────────────────────────────┤
│  Adapters: typed source interfaces                            │
│   ├── MockAdapter (MVP)         ── realistic WooCommerce data  │
│   └── WooHttpAdapter (FUTURE)   ── talks to OUR backend/proxy  │
├──────────────────────────────────────────────────────────────┤
│  Transport: fetch-based HttpClient (configurable base URL)    │
└──────────────────────────────────────────────────────────────┘
                         │ (future)
                         ▼
        Backend / Proxy (apps/api | services/api) ── holds secrets,
        signs WooCommerce/WordPress calls, returns frontend-safe data
```

Rules enforced by this architecture:
- Screens depend on **services**, never on `fetch` or adapters directly.
- Services depend on an **adapter interface**, resolved by config (mock vs http).
- Only the future backend/proxy ever holds real credentials.

## 3. Routing (Expo Router)

File-based routing; route groups separate auth from the authenticated shell.

```
app/
├── _layout.tsx                  root providers (theme, query, i18n, auth gate)
├── (auth)/
│   ├── _layout.tsx              redirects to (app) if already authed
│   └── sign-in.tsx
└── (app)/
    ├── _layout.tsx              AppShell (sidebar/topbar web, drawer/tabs native)
    ├── index.tsx                Dashboard overview
    ├── connect-site/
    │   ├── index.tsx            connection status + start flow
    │   └── new.tsx              add a site (URL + backend/proxy explanation)
    ├── products/
    │   ├── index.tsx            list + search/filter
    │   ├── new.tsx              create form
    │   └── [id].tsx             detail + edit + delete confirm
    ├── orders/
    │   ├── index.tsx            list + filters
    │   └── [id].tsx             detail + status update
    ├── customers/
    │   ├── index.tsx            list
    │   └── [id].tsx             detail + order-history placeholder
    └── settings/
        └── index.tsx
```

- Protected routes live under `(app)`; the `(app)/_layout.tsx` checks the session store
  and redirects unauthenticated users to `(auth)/sign-in`.
- Navigation state (active route highlight) is derived from Expo Router, not custom state.
- No `react-router`/DOM routing anywhere.

## 4. State management

Two complementary layers:

- **Zustand (client/UI state)** — small, focused stores:
  - `sessionStore`: auth status, current user (mock), sign-in/out actions, auth boundary.
  - `activeSiteStore`: connected sites (non-secret metadata) + active site reference;
    switching the active site invalidates relevant queries.
  - `themeStore`: mode (light/dark/system) + direction (LTR/RTL) preferences.
  - `uiStore`: ephemeral UI (sidebar collapsed, drawer open, toasts).
- **TanStack Query (server state)** — caching, loading/error/refetch for all data reads
  and mutations, keyed by `[domain, activeSiteId, params]` so site switches are isolated.

Rationale: Zustand is already proven in Ecme and is RN-safe; TanStack Query removes
hand-rolled loading/error/cache logic and standardizes the loading/empty/error states the
quality bar requires.

## 5. Data layer, mock layer, and API adapter layer

### 5.1 Adapter interfaces (the seam for future real integration)
Each domain defines a typed interface (illustrative, not final code):

```
interface ProductAdapter {
  list(query: ProductQuery): Promise<Paged<Product>>;
  get(id: string): Promise<Product>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
  remove(id: string): Promise<void>;
}
// Similar: OrderAdapter, CustomerAdapter, DashboardAdapter, SiteAdapter, AuthAdapter
```

- **MVP:** `MockProductAdapter`, etc., implement these against in-memory realistic data
  with simulated latency and occasional error injection (to exercise error states).
- **Future:** `WooHttpProductAdapter`, etc., implement the same interfaces by calling
  **our backend/proxy** (never the store directly from the client).
- A single `adapterFactory` selects mock vs http from `app.config` (`dataSource: 'mock'`).

### 5.2 Service wrappers
Thin per-domain services wrap the active adapter and add mapping/validation. Screens call
services through TanStack Query hooks (e.g. `useProducts`, `useOrder(id)`).

### 5.3 Transport
A `fetch`-based `HttpClient` with configurable base URL, JSON handling, and typed errors.
Used only by future http adapters; the mock adapter does not touch it.

## 6. Realistic WooCommerce-like domain models

Mock data mirrors WooCommerce/WordPress REST shapes (a subset), not random placeholders.
Illustrative TypeScript shapes:

```
type Money = string;            // decimal string, e.g. "29.99" (WooCommerce style)
type ISODate = string;          // ISO 8601

interface Product {
  id: string; name: string; slug: string; sku: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'publish' | 'draft' | 'pending' | 'private';
  price: Money; regularPrice: Money; salePrice?: Money;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number; manageStock: boolean;
  categories: { id: string; name: string; slug: string }[];
  images: { id: string; src: string; alt: string }[];
  dateCreated: ISODate; dateModified: ISODate;
}

interface OrderLineItem {
  id: string; productId: string; name: string; sku: string;
  quantity: number; price: Money; total: Money;
}
interface Order {
  id: string; number: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed'
        | 'cancelled' | 'refunded' | 'failed';
  currency: string; total: Money; subtotal: Money;
  totalTax: Money; shippingTotal: Money; discountTotal: Money;
  customerId?: string;
  billing: { firstName: string; lastName: string; email: string;
             phone?: string; address1?: string; city?: string;
             postcode?: string; country?: string };
  shipping?: { address1?: string; city?: string; postcode?: string; country?: string };
  lineItems: OrderLineItem[];
  paymentMethodTitle: string;
  statusHistory: { status: Order['status']; date: ISODate; note?: string }[];
  dateCreated: ISODate; dateModified: ISODate;
}

interface Customer {
  id: string; firstName: string; lastName: string; email: string;
  username: string; role: 'customer' | 'subscriber';
  ordersCount: number; totalSpent: Money;
  avatarUrl?: string; dateCreated: ISODate;
  billing?: Order['billing'];
}

interface SiteConnection {                // frontend-safe ONLY (no secrets)
  id: string; name: string; url: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  wooVersion?: string; wpVersion?: string;
  currency?: string; timezone?: string;
  lastSyncedAt?: ISODate;
  // NO consumer key/secret or app password fields ever stored here
}

interface DashboardSummary {
  period: { from: ISODate; to: ISODate };
  salesTotal: Money; ordersCount: number;
  productsCount: number; customersCount: number;
  recentOrders: Order[]; topProducts: { product: Product; unitsSold: number }[];
  activity: { id: string; type: string; message: string; date: ISODate }[];
}
```

Mock datasets contain a believable spread of statuses, currencies, stock states, and
dates so list/filter/detail screens look and behave realistically.

## 7. Backend / proxy plan (documented; not built in MVP)

- **Location (future):** `apps/api` or `services/api` (see `structure.md`).
- **Responsibilities:** store per-site credentials encrypted at rest; authenticate the
  app's users; sign/authorize outbound WooCommerce/WordPress REST calls; return only
  frontend-safe data; issue short-lived, revocable session/connection references; log
  privileged actions (redacted).
- **Contract:** the future `WooHttpAdapter` set targets backend endpoints (e.g.
  `/sites/:id/products`), never the store's WooCommerce endpoint directly.
- **Why:** keeps secrets off the client/device and out of the bundle (see `security.md`).
- **Migration path:** flip `dataSource` from `mock` to `http` and point `HttpClient` at the
  backend; adapter interfaces stay identical, so screens don't change.

## 8. Security model (summary; full rules in `security.md`)

- **Frontend-safe data only on the client:** site name/URL/status/metadata, connection
  reference, UI preferences.
- **Sensitive credentials** (WooCommerce key/secret, WP application passwords) are handled
  exclusively by the backend/proxy in production — never entered, stored, or transmitted by
  the frontend in production.
- **Per-site isolation:** the active-site context carries a non-secret id only; query keys
  are namespaced by site id.
- **Revocation/disconnect:** disconnect revokes server-side credentials and invalidates the
  connection reference; UI updates immediately.
- **Audit/logging:** privileged actions logged server-side, secrets redacted.
- **No secrets in git; no secrets in frontend builds.** MVP uses mock/non-production data
  only and shows security warnings wherever credentials are mentioned.

## 9. UI / design system

- **Styling decision:** default to a **typed token-based React Native `StyleSheet`** system
  (`tech.md` Option B) for maximum cross-platform predictability and minimal deps;
  NativeWind (Option A) is an acceptable alternative if the team prefers Tailwind
  ergonomics. The choice is recorded here and applied consistently. **Selected: Option B
  (typed tokens) for the MVP** unless changed before implementation begins.
- **Tokens (`theme/tokens.ts`):** color roles (background, surface, border, text,
  textMuted, primary, success, warning, danger, info), spacing scale, radius scale,
  typography scale, elevation. Light + dark token sets; consumed via `useTheme()`.
- **Primitives (`components/ui`):** `Screen`, `Card`, `Button`, `Text`, `Input`,
  `Select`, `Tag`/`Badge`, `Avatar`, `DataTable`/`DataList`, `Tabs`, `Dialog`/`BottomSheet`,
  `Skeleton`, `EmptyState`, `ErrorState`. Built from RN primitives only.
- **Layout (`components/layout`):** `AppShell`, `Sidebar` (web), `TopBar`, `MobileNav`
  (drawer/tabs native) — platform-aware via `*.web.tsx` / `*.native.tsx`.
- **Ecme inspiration:** dashboard composition, card/table/filter patterns, sidebar/topbar
  rhythm, spacing, dark/light feel — reinterpreted, never copied (see `ecme-reference.md`).

## 10. Cross-platform strategy

- RN primitives everywhere; no DOM elements or browser globals in shared code.
- Responsive behavior via `useWindowDimensions`/breakpoint helper; web shows sidebar,
  narrow/native shows drawer or tabs.
- Platform-specific files (`*.web.tsx` / `*.native.tsx`) isolate any divergence behind one
  interface; web-rich-only widgets (advanced charts/maps) sit behind a `Chart` wrapper.
- Charts standardized on a `react-native-svg`-based library; animations via
  `react-native-reanimated`.
- Storage abstraction picks `expo-secure-store`/`AsyncStorage` on native and a safe,
  non-secret store on web — never `localStorage` directly in shared code.

## 11. RTL & i18n strategy

- `i18next` + `react-i18next`; all user-facing strings come from locale resources (no
  hard-coded copy).
- Direction managed via RN `I18nManager` plus a `direction` preference in `themeStore`;
  layout primitives use logical start/end rather than hard left/right.
- Ship at least one LTR and one RTL locale resource scaffold to validate mirroring early
  (Ecme itself defaults to RTL — we treat RTL as first-class, not an afterthought).
- Number/currency/date formatting via `Intl` with locale + store currency awareness.

## 12. Testing strategy

- **Unit:** domain mappers, adapter mock logic, zod schemas, utility/formatters
  (Jest + ts-jest / Expo preset).
- **Component:** primitives and key screens via `@testing-library/react-native` (loading,
  empty, error, and success states; RTL rendering smoke test).
- **Contract:** every adapter conforms to its interface; a shared test suite runs against
  the mock adapter now and the http adapter later to guarantee parity.
- **Type-safety as testing:** `tsc --noEmit` in CI is a required gate.
- **E2E (later):** Playwright for web; Detox/Maestro path noted for native — not in the
  first implementation task.
- **CI gates:** lint + type-check + unit/component tests must pass before merge; PRs only.

## 13. Configuration & environments

- `app.config.ts`: `dataSource: 'mock' | 'http'`, `apiBaseUrl`, default locale/direction,
  feature flags. MVP defaults to `mock`.
- No secrets in any committed config; environment-specific values supplied at build/deploy
  via the backend, not the frontend bundle.

## 14. Risks & mitigations (design-level)

| Risk | Mitigation |
| --- | --- |
| Porting Ecme web code by habit | Fresh RN design system; Ecme is reference-only; review enforces it. |
| Web-only deps leaking to native | Platform splits + lint rules; charts/maps behind wrappers. |
| Secrets creeping into frontend | Backend/proxy owns secrets; SiteConnection model has no secret fields; security warnings in UI. |
| Multi-site data bleed | Query keys namespaced by active site id; per-site isolation. |
| Mock→real divergence | Shared adapter contract test suite runs against both implementations. |
| RTL/i18n retrofitting | RTL + i18n first-class from the shell task onward. |

## 15. Traceability (requirements → design)

- R1 App shell → §3 routing, §9 UI, §10 cross-platform, §11 RTL/i18n.
- R2 Auth/session → §3 route groups, §4 sessionStore, §8 security.
- R3 Connect site → §6 SiteConnection model, §7 backend/proxy, §8 security.
- R4 Dashboard → §5 services, §6 DashboardSummary, §9 widgets.
- R5 Products / R6 Orders / R7 Customers → §5 adapters/services, §6 models, §12 tests.
- R8 Settings → §8 security warnings, §9 theme, §11 RTL/i18n.
- R9 Cross-cutting quality → §2 layering, §9 design system, §10 cross-platform, §12 tests.
