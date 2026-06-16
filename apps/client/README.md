# WooCommerce Client Dashboard — `apps/client`

A production-grade management dashboard our clients use to operate their own
WordPress/WooCommerce sites. Built **React Native first** with **Expo + React Native +
React Native Web + TypeScript + Expo Router**. The first deliverable is a **web app**; the
architecture is kept viable for **Android and iOS** without a rewrite.

> This package was introduced by Task 1 of the spec
> `.kiro/specs/wordpress-woocommerce-client-dashboard-mvp`. It currently contains the app
> **skeleton + authenticated dashboard shell + a mocked dashboard overview**. Other modules
> (auth, connect-site, products, orders, customers, settings) arrive in later tasks.

## Requirements

- Node.js 18+ (developed on Node 22)
- npm 9+

## Install

```bash
cd apps/client
npm install
```

## Run the web app locally

```bash
npm run web
```

This starts the Expo dev server (Metro bundler) and serves the app in your browser. Vite is
intentionally not used; the web bundler is Metro.

To produce a static web build:

```bash
npm run export:web   # outputs to ./dist (gitignored)
```

## Type-check

```bash
npm run typecheck    # tsc --noEmit (strict mode)
```

## Lint & format

```bash
npm run lint         # ESLint (eslint-config-expo + Prettier compatibility)
npm run format       # Prettier check
npm run format:write # Prettier write
```

## What is in this package (Task 1)

- Expo managed app with Expo Router file-based routing (`app/`).
- Root provider tree (`src/providers/AppProviders.tsx`): SafeArea, TanStack Query,
  Theme, i18n placeholder, and a mock session boundary (auth gate placeholder).
- Authenticated app shell (`src/components/layout`): persistent **sidebar + topbar** on wide
  web; **topbar + horizontal mobile-nav placeholder** on narrow/native. RTL-aware,
  dark/light-aware.
- Theme token system (`src/theme`): typed light/dark tokens consumed via `useTheme()`.
- Minimal UI primitives (`src/components/ui`): `Screen`, `Text`, `Card`, `Button`, `Badge`,
  `DataList`.
- Mock data + adapter + service seam (`src/mock`, `src/adapters`, `src/services`): the
  dashboard reads realistic WooCommerce-like data through a `DashboardAdapter` interface.
- Dashboard overview (`src/features/dashboard`): KPI metric cards (sales/orders/products/
  customers), recent orders, and top products, with loading/error/empty states.

## Architecture notes

- **Layers:** screens → services → adapters → (future) backend/proxy. Screens never call
  `fetch` directly; data flows through services and adapter interfaces.
- **Data source:** `src/config/app.config.ts` (`dataSource: 'mock'`). A future `'http'`
  source will target OUR backend/proxy, never a store directly. No store credentials ever
  live in the frontend (see `.kiro/steering/security.md`).
- **Styling:** typed token-based React Native `StyleSheet` (no NativeWind, no CSS variables,
  no `className` cascade) for predictable cross-platform rendering.

## Android / iOS viability (later)

The codebase is written for native from day one:

- Only React Native primitives are used (`View`, `Text`, `Pressable`, `ScrollView`, …); no
  raw DOM elements, no `window`/`document`/`localStorage` in app code.
- `react-dom` / `react-native-web` are present only as Expo's web infrastructure; they are
  never imported by app code.
- When targeting devices later: run `npx expo run:android` / `npx expo run:ios` (or use
  EAS Build). Native project folders (`android/`, `ios/`) are intentionally **not** checked
  in and are produced by `expo prebuild`/EAS when needed.

## Security

- No real WooCommerce/WordPress credentials, API calls, or secrets exist in this package.
- All data is local, realistic mock data for development only.
