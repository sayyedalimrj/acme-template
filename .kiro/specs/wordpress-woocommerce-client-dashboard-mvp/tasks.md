# Implementation Plan — WordPress/WooCommerce Client Dashboard (MVP)

Spec: `wordpress-woocommerce-client-dashboard-mvp`

> **Not started in this PR.** This PR adds steering + spec only. No Expo app and no
> implementation code are created here. Each task below is a separate, reviewable PR.

## Working rules for every task
- Work on a feature branch; **open a PR**; never direct-push to `master`.
- **Never modify `Theme/`.** Build the app under **`apps/client`**.
- Keep **Web + Android + iOS** compatibility; no browser globals, raw DOM, React DOM
  routers, Vite, or DOM-only libraries (see `.kiro/steering/tech.md`).
- All data through **service + adapter** layers; mock data must be **realistic
  WooCommerce-like** (see `design.md` §6).
- Follow `security.md`: no secrets in git/frontend; no real WooCommerce writes in the MVP.
- Meet the Definition of Done in `quality-bar.md` (type-check, lint, tests, states).

---

- [ ] 1. **Expo project skeleton + dashboard shell with mocked data**
  - Scaffold the Expo (managed) + React Native Web + TypeScript app under `apps/client`
    with Expo Router; configure strict TS, ESLint/Prettier, Metro (no Vite).
  - Add the root provider tree (`app/_layout.tsx`): theme provider, query client, i18n
    init, auth gate placeholder.
  - Implement the authenticated **AppShell** (`(app)/_layout.tsx`): web sidebar + topbar,
    native drawer/tabs, RTL-ready and dark/light-ready, from RN primitives only.
  - Add a single **Dashboard overview** screen (`(app)/index.tsx`) rendering metric cards,
    recent orders, and top products from **mock data** (realistic WooCommerce shapes).
  - Add minimal theme tokens + a few `components/ui` primitives needed for the shell.
  - **Scope guard:** only the skeleton + shell + mocked dashboard. No other modules.
  - _Requirements: R1, R4 (partial); Design §2, §3, §9, §10._

- [ ] 2. **Design-system foundation: tokens, theme, core primitives**
  - Finalize `theme/tokens.ts` (light/dark), `ThemeProvider`, `useTheme()`, RTL helpers.
  - Build core `components/ui`: `Screen`, `Card`, `Button`, `Text`, `Input`, `Select`,
    `Tag`/`Badge`, `Avatar`, `Skeleton`, `EmptyState`, `ErrorState`.
  - Add component tests (loading/empty/error + RTL smoke).
  - _Requirements: R1, R9; Design §9, §11, §12._

- [ ] 3. **Adapter + service + mock layer foundation**
  - Define adapter interfaces (Product/Order/Customer/Dashboard/Site/Auth) and the
    `adapterFactory` driven by `app.config.dataSource`.
  - Implement mock adapters with realistic datasets, simulated latency, and error
    injection; add the shared **adapter contract test suite**.
  - Wire TanStack Query hooks per domain; namespace query keys by active site id.
  - _Requirements: R9; Design §2, §5, §6, §12._

- [ ] 4. **Auth / session foundation**
  - Build `(auth)/sign-in.tsx` with mock auth; `sessionStore`; protected-route redirects
    in `(app)/_layout.tsx`; sign-out.
  - Define the auth boundary interface for future real auth; no production credential
    storage.
  - _Requirements: R2; Design §3, §4, §8._

- [ ] 5. **Active-site context + Connect site (mock + backend/proxy explanation)**
  - `activeSiteStore` (non-secret metadata) + site switcher in the shell.
  - `connect-site` screens: enter site URL, show connection status, disconnect/revoke;
    surface the **backend/proxy requirement** and **security warnings**; no real secrets.
  - _Requirements: R3; Design §6, §7, §8._

- [ ] 6. **Dashboard overview — complete**
  - Flesh out metrics (sales/orders/products/customers), recent orders, top products, and
    activity/status widget against mock services; full loading/empty/error states.
  - Introduce the `Chart` wrapper (react-native-svg based) behind a platform-safe interface.
  - _Requirements: R4; Design §5, §9, §10._

- [ ] 7. **Products module**
  - List with search/filter, detail, create/edit form (react-hook-form + zod), delete
    confirmation — all via mock product service behind the adapter interface.
  - _Requirements: R5; Design §5, §6, §9, §12._

- [ ] 8. **Orders module**
  - List with status/date/customer filters, detail (line items, totals, status history),
    status-update UI — via mock order service behind the adapter interface.
  - _Requirements: R6; Design §5, §6, §9, §12._

- [ ] 9. **Customers/users module**
  - List, detail, and order-history placeholder via mock customer service behind the
    adapter interface.
  - _Requirements: R7; Design §5, §6, §9._

- [ ] 10. **Settings module**
  - Site connection status, theme preference placeholder, language/RTL placeholder, app
    preferences, and credential **security warnings**.
  - _Requirements: R8; Design §8, §9, §11._

- [ ] 11. **i18n + RTL hardening pass**
  - Externalize all strings; add LTR + RTL locale scaffolds; verify mirrored layouts and
    locale-aware number/currency/date formatting.
  - _Requirements: R1, R8, R9; Design §11._

- [ ] 12. **Quality, accessibility, and cross-platform verification**
  - Audit loading/empty/error states, accessibility labels, and responsive behavior.
  - Verify no forbidden deps/globals leaked; confirm native build viability checks.
  - Establish CI gates (lint + type-check + tests) for the app package.
  - _Requirements: R9; Design §10, §12, §13._

---

## Future (post-MVP, documented only — not scheduled here)
- Backend/proxy implementation under `apps/api` or `services/api` and the `WooHttpAdapter`
  set; flip `dataSource` to `http`.
- Real WooCommerce/WordPress integration **only after** mock UI + adapters + security model
  are reviewed and approved.
- Shared types extracted to `packages/shared` if duplication warrants it.
- Native (Android/iOS) build/release pipeline and native E2E (Detox/Maestro).
