---
inclusion: always
---

# Technology Steering

## Core stack (committed)

- **Runtime/framework:** React Native via **Expo (managed workflow)**.
- **Web rendering:** **React Native Web** (the first deliverable is a web app).
- **Language:** **TypeScript** in `strict` mode. No implicit `any`.
- **Routing:** **Expo Router** (file-based). Do **not** use React DOM routers
  (`react-router-dom`) or Vite-specific routing.
- **Server state / data fetching:** TanStack Query (React Query) over a `fetch`-based
  client. (SWR is acceptable, but standardize on one; default is TanStack Query.)
- **Client/UI state:** Zustand for session, theme, UI, and active-site context.
- **Forms & validation:** react-hook-form + zod (both are cross-platform safe).
- **i18n:** i18next / react-i18next. RTL via React Native `I18nManager` + direction-aware
  layout primitives.
- **Icons:** a cross-platform set (e.g. `@expo/vector-icons`). No `react-icons` (DOM).
- **Secure storage (native):** `expo-secure-store`; preferences via `AsyncStorage`.
  Never `localStorage`/cookies in shared code.

## Styling decision — document the tradeoff before choosing

Two acceptable options; the spec's `design.md` must record the final pick and rationale.

- **Option A — NativeWind (Tailwind-like for RN).**
  - Pros: familiar Tailwind ergonomics, fast iteration, maps cleanly to Ecme's
    token thinking, good web + native support.
  - Cons: extra build/runtime dependency, class-string indirection, must verify native
    parity for each utility used.
- **Option B — Typed token-based React Native `StyleSheet`.**
  - Pros: zero extra deps, fully explicit, easiest to reason about cross-platform,
    strongest TypeScript guarantees on tokens.
  - Cons: more boilerplate, must hand-build responsive/variant helpers.

**Default recommendation:** Option B (typed token-based `StyleSheet`) for maximum
cross-platform predictability and minimal dependency surface, with a small typed theme
(`tokens.ts`) and a `useTheme()` hook. If the team prefers Tailwind ergonomics, Option A
is acceptable — but the choice must be made once, documented, and applied consistently.

## Cross-platform compatibility rules (non-negotiable)

- **No browser globals in shared code:** no `window`, `document`, `localStorage`,
  `navigator` assumptions, cookies, or `process.browser`. Use RN APIs
  (`Dimensions`, `useWindowDimensions`, `Platform`, `AsyncStorage`, `expo-secure-store`).
- **No raw DOM elements** (`<div>`, `<span>`, `<button>`, `<img>`, headings). Use RN
  primitives (`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `FlatList`).
- **No DOM-only / React-DOM-only libraries** in shared code (e.g. `react-apexcharts`,
  `@fullcalendar/*`, `@tiptap/*`, `react-modal`, `react-select`, `simplebar-react`,
  `framer-motion` DOM features, `react-simple-maps`).
- **Isolate unavoidable web-rich widgets** (e.g. advanced charts/maps) behind a wrapper
  with platform splits: `Component.web.tsx` / `Component.native.tsx`, exposing one
  cross-platform interface.
- **Charts:** standardize on a `react-native-svg`-based library behind a `Chart` wrapper.
- **Animations:** `react-native-reanimated` / RN `Animated`, not DOM animation libs.
- **Networking:** `fetch` with a configurable base URL; verify CORS for RN Web early.

## Build, tooling, and quality gates

- Package manager: npm (match repo conventions) unless the spec states otherwise.
- Linting/formatting: ESLint + Prettier; lint must pass in CI before merge.
- Type-check (`tsc --noEmit`) must pass in CI.
- Tests: see `quality-bar.md` and the spec's testing strategy.
- Metro/Expo config only; **no Vite** in the new app.

## Things explicitly forbidden in the new app

- React DOM, `react-dom`, Vite, Tailwind PostCSS web pipeline, CSS files / `className`
  cascade assumptions, CSS variables for theming (`var(--x)`), DOM event APIs.
- Embedding any secret, key, or token in the frontend bundle or in git.
