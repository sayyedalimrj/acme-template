# AGENTS.md — Operating Rules for AI Agents & Contributors

This repository hosts a **production-grade** React Native / Expo WooCommerce client
dashboard project. Read this file and the steering files in `.kiro/steering/` before doing
any work. These rules are binding.

## Project at a glance

- **Product:** a serious management dashboard our **clients** use to operate their own
  WordPress/WooCommerce sites. Their end-customers do **not** use this app.
- **Stack:** Expo + React Native + React Native Web, TypeScript, Expo Router.
  Web app MVP first; **must stay viable for Android and iOS**.
- **Reference:** the `Theme/` folder is the **Ecme** admin template — inspiration only.

## Source of truth

| Topic | File |
| --- | --- |
| Product scope, users, non-goals | `.kiro/steering/product.md` |
| Tech stack, cross-platform rules | `.kiro/steering/tech.md` |
| Repo layout & conventions | `.kiro/steering/structure.md` |
| Credentials & security model | `.kiro/steering/security.md` |
| Using Ecme as inspiration | `.kiro/steering/ecme-reference.md` |
| Quality bar & Definition of Done | `.kiro/steering/quality-bar.md` |
| Feature plan (MVP) | `.kiro/specs/wordpress-woocommerce-client-dashboard-mvp/` |

## Golden rules (do not break)

1. **Branch + PR only.** Always work on a feature branch and open a pull request.
   **Never push directly to `master`/`main`.**
2. **Never modify `Theme/`.** It is a read-only Ecme reference. No edits, renames, moves,
   or deletions.
3. **Cross-platform first.** Preserve **React Native / Expo / Web / Android / iOS**
   compatibility in every change. No `window`, `document`, `localStorage`, raw DOM
   elements, React DOM routers, Vite, or DOM-only libraries in the new app
   (see `tech.md`).
4. **Security is non-negotiable.** No secrets in git or frontend builds. WooCommerce
   keys/secrets and WordPress application passwords go through a backend/proxy, never the
   frontend (see `security.md`). No real store writes until mock UI + adapters + security
   model are reviewed.
5. **Inspiration, not cloning.** Use Ecme for layout/UX/token ideas only; do not port its
   components or copy it pixel-perfect.
6. **Production-grade MVP.** Limited scope, engineered seriously. Follow the Definition of
   Done in `quality-bar.md`.

## Where new code goes (later)

- New product app: **`apps/client`** (created in a future task, not yet).
- Future backend/proxy: **`apps/api`** or **`services/api`** (documented for now only).
- Shared types: **`packages/shared`** (only if needed later).

## Workflow checklist for any task

- [ ] Created/used a feature branch (not `master`).
- [ ] Read relevant steering + spec files.
- [ ] Change keeps Web + Android + iOS compatibility.
- [ ] No secrets added; security model respected.
- [ ] `Theme/` untouched.
- [ ] Type-check, lint, and relevant tests pass.
- [ ] Mock data is realistic WooCommerce-like (not random placeholders).
- [ ] Opened a PR with a clear description (what changed, how tested, limitations).
