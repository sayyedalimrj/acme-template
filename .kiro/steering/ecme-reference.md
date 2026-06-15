---
inclusion: auto
description: How to use the Ecme template under Theme/ as inspiration for UI, layout, and design work. Apply this whenever doing UI, layout, navigation, dashboard, theming, or design-token tasks.
---

# Ecme Reference Steering (inspiration only)

The template under `Theme/` is **Ecme**, a React + Vite + TypeScript **web** admin
dashboard template. `Theme/TypeScript/main` is the **primary visual and structural
reference**. Use it only for inspiration. **Never modify `Theme/`.**

## How to use Ecme

Treat Ecme as a mood board and information-architecture reference, not a source to port.

**Draw inspiration from:**
- Overall dashboard **layout** and app-shell composition.
- **Sidebar / topbar** navigation patterns; mobile nav behavior.
- **Spacing**, density, and visual rhythm.
- **Cards**, **tables**, **forms**, **filters**, **modals/drawers**, **tabs**.
- **Dashboard widget** composition (KPI/stat cards, recent orders, top products,
  demographics, period selectors) — especially `views/dashboards/EcommerceDashboard`.
- **CRUD flows**: the List → Table → Filter → Tools, plus Create/Edit/Detail
  decomposition seen in `views/concepts/orders` and `views/concepts/products`.
- **Design-token ideas**: semantic color roles, dark/light modes, radius/spacing scales.
- **RTL-aware** layout and **i18n** thinking (Ecme defaults to RTL).

## Best reference folders (ranked)

1. `Theme/TypeScript/main/src/views/dashboards/EcommerceDashboard` — closest domain.
2. `Theme/TypeScript/main/src/views/concepts/orders` and `.../products` — CRUD blueprint.
3. `Theme/TypeScript/main/src/components/template` — sidebar/topbar/nav/theme switching.
4. `Theme/TypeScript/main/src/components/layouts/PostLoginLayout` — app-shell modes.
5. `Theme/TypeScript/main/src/components/ui` — component **catalog** (build our own).
6. `Theme/TypeScript/main/src/views/concepts/customers` — customers list/detail.
7. `Theme/TypeScript/main/src/configs` — token/nav/chart config modeling ideas.

## Do NOT

- **Do not** port Ecme components/files into the new app.
- **Do not** copy Ecme pixel-perfect or attempt a 1:1 clone.
- **Do not** carry over its web-only implementation: Vite, React DOM, `react-router`,
  Tailwind/PostCSS + `className`, CSS variables (`var(--x)`), `window`/`document`/
  `localStorage`, raw DOM elements, `react-apexcharts`, `@fullcalendar/*`, `@tiptap/*`,
  `react-modal`, `react-select`, `react-simple-maps`, `framer-motion` DOM features.
- **Do not** modify, move, rename, or delete anything under `Theme/`.

## Translation guidance (Ecme → our app)

- Ecme CSS-variable tokens → a typed JS theme (`tokens.ts`) consumed via `useTheme()`.
- Ecme `<div className="...">` → RN `View` + our styling system.
- Ecme `react-router` routes → Expo Router file-based routes.
- Ecme ApexCharts widgets → a `react-native-svg`-based `Chart` wrapper.
- Ecme `axios` + `axios-mock-adapter` mock layer → a `fetch`-based mock layer behind
  adapter interfaces.

The goal is **our own product** with a similar professional admin-dashboard feel —
cross-platform from day one.
