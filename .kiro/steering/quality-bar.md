---
inclusion: always
---

# Quality Bar

## Mindset: production-grade MVP

This is the foundation of a **serious commercial product**. It is **not** a toy
prototype, **not** a throwaway MVP, and **not** a quick demo. The MVP is **limited in
scope but engineered seriously**. Every decision must support long-term
**maintainability, cross-platform delivery, security, and future scale**.

When a shortcut conflicts with these goals, choose the maintainable path or stop and flag
the tradeoff. "It works on web for now" is not acceptable justification for breaking
native compatibility or the security model.

## Engineering standards

- **TypeScript strict**, no `any` escapes, typed public interfaces for services/adapters.
- **Clean design system from day one** — shared tokens and primitives; no ad-hoc
  one-off styles scattered across screens.
- **Separation of concerns** — UI ⟂ state ⟂ data/service/adapter layers. Screens never
  call `fetch` directly; data flows through services + adapters.
- **Cross-platform safety** — code must remain valid for Web, Android, and iOS. No
  browser globals or DOM-only deps in shared code (see `tech.md`).
- **Security first** — follow `security.md`; no secrets in git or frontend builds; no
  real store writes before review.
- **Accessibility & states** — every screen handles loading / empty / error states and
  uses accessible RN components and labels.
- **i18n + RTL ready** — no hard-coded user-facing strings; layouts work in RTL.
- **Consistent, documented decisions** — significant choices (styling system, charts,
  data layer) recorded in the spec `design.md`.

## Definition of Done (per future implementation task)

A task is done only when:
- Type-check (`tsc --noEmit`) passes and lint/format pass.
- The change keeps Web + Android + iOS compatibility (no forbidden deps/globals).
- Loading/empty/error states are handled for any new screen.
- Mock data used is realistic WooCommerce-like domain data (not random placeholders).
- The security model is respected (no secrets, no real writes pre-review).
- Tests appropriate to the change exist (see testing strategy in the spec), and pass.
- Work is delivered via a **pull request** — never a direct push to `master`.

## Workflow rules (binding for all future tasks)

- **Always work on a branch and open a PR.** Never direct-push to `master`/`main`.
- Keep PRs **small, sequential, and reviewable**; one logical change per PR.
- **Never modify `Theme/`.**
- Preserve **React Native / Expo / Web / Android / iOS** compatibility in every change.
- Do not introduce real WooCommerce/WordPress writes until mock UI + adapter interfaces +
  security model are reviewed and approved.

## Review expectations

- PR descriptions state what changed, what was tested, and any known limitations.
- Reviewers verify: cross-platform safety, security compliance, design-system
  consistency, and that `Theme/` is untouched.
