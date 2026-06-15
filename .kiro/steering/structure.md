---
inclusion: always
---

# Repository Structure Steering

## Repository layout (current + planned)

```
/                              repo root
├── Theme/                     Ecme reference template (DO NOT MODIFY)
│   ├── JavaScript/demo/       Ecme JS variant (reference only)
│   └── TypeScript/main/       Ecme TS variant — PRIMARY visual/structural reference
├── .kiro/
│   ├── steering/              project steering (this folder)
│   └── specs/                 feature specs
├── AGENTS.md                  agent operating rules
│
│   # ---- created LATER, not in the steering+spec PR ----
├── apps/
│   ├── client/                the new Expo + RN Web product app (FUTURE)
│   └── api/                   optional backend/proxy (FUTURE; documented only)
├── services/
│   └── api/                   alternative home for backend/proxy (FUTURE; documented)
└── packages/
    └── shared/                shared TypeScript types/contracts (FUTURE, if needed)
```

## Hard rules

- **Never modify anything under `Theme/`.** It is a read-only reference. No edits,
  renames, deletions, or moves.
- The new product app is created **later**, under **`apps/client`**. It is not part of
  the steering+spec PR.
- A future backend/proxy lives under **`apps/api`** or **`services/api`**. For now it is
  only documented (see `security.md` and the spec `design.md`).
- Shared types may later live under **`packages/shared`** if a backend/proxy is added or
  duplication appears. Do not create it speculatively.

## Planned internal structure for `apps/client` (for reference only)

```
apps/client/
├── app/                       Expo Router routes (file-based)
│   ├── (auth)/                sign-in and auth screens
│   └── (app)/                 authenticated shell + feature routes
├── src/
│   ├── components/ui/         RN design-system primitives
│   ├── components/layout/     AppShell, Sidebar, TopBar, MobileNav (platform-aware)
│   ├── features/              dashboard/ orders/ products/ customers/ connect-site/
│   │                          settings/ (screens + hooks + local stores)
│   ├── services/              api client + per-domain service wrappers + adapters
│   ├── adapters/              WooCommerce/WordPress adapter interfaces (+ mock impl)
│   ├── mock/                  fetch-based mock layer + realistic WooCommerce data
│   ├── store/                 zustand stores (session, theme, ui, activeSite)
│   ├── theme/                 tokens, ThemeProvider, dark/light, RTL helpers
│   ├── i18n/                  i18n setup + locale resources
│   └── config/                app.config, navigation.config
└── (expo/metro/ts/lint config files)
```

## Naming & organization conventions

- Feature-first organization under `src/features/<domain>`; each feature owns its
  screens, hooks, local store, and types.
- Cross-cutting primitives live in `src/components/ui`; layout chrome in
  `src/components/layout`.
- Platform-specific implementations use `*.web.tsx` / `*.native.tsx` with a shared
  `index.ts` re-export and a single typed interface.
- One styling system across the whole app (per `tech.md` decision); no mixing.
- Data access always goes through `services/` + `adapters/`; screens never call `fetch`
  directly.

## Where steering and specs live

- Steering: `.kiro/steering/*.md`.
- Specs: `.kiro/specs/<spec-name>/{requirements.md,design.md,tasks.md}`.
