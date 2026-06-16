---
inclusion: always
---

# Platform Vision Steering — WordPress Commerce Operating System

The product has evolved beyond a single-store dashboard. It is now a **WordPress Commerce
Operating System (Commerce OS)**: a SaaS platform where merchants either **connect an
existing** WordPress/WooCommerce site or have us **launch a new** store for them, and then
run everything (catalog, orders, customers, inventory, fulfillment, marketing, AI advisor,
growth) from our dashboard instead of `wp-admin`.

This file sets the binding strategic direction. Detailed plans live in
`.kiro/specs/wordpress-commerce-os-platform/` (vision, onboarding-paths, architecture,
security-model, roadmap). The original dashboard MVP spec
(`wordpress-woocommerce-client-dashboard-mvp`) remains the source of truth for the shipped
Phase 0 modules.

## What the platform is
- A **merchant SaaS dashboard** (the current `apps/client`).
- A **managed WordPress store launch service** (we provision stores for customers).
- An **existing-site handover/connection service** (connect or hand over a live store).
- A **growth / AI / automation layer** (advisor, events, SMS/back-in-stock, campaigns).
- A **subscription business** (Starter / Growth / Pro / Managed).

## Two onboarding paths (summary)
- **Path A — Existing site:** customer already has WordPress/WooCommerce → connect later
  via backend/proxy or companion plugin, or request a **managed handover**.
- **Path B — New store launch:** customer has no store → submit domain/business info,
  pick a template + package → our team provisions → the live store connects to the
  dashboard.

See `onboarding-paths.md` for fields, request types, and status flows.

## Non-negotiable guardrails (unchanged, reinforced)
- **No real WooCommerce keys/secrets or WordPress application passwords in the frontend.**
  Ever. Real connections are handled by a **backend/proxy** or a **WordPress companion
  plugin** later (see `security-model.md` and `.kiro/steering/security.md`).
- **No production secrets in app builds; none in git.** Mock-only until the backend +
  security review exist.
- **React Native / Expo first**, Web/Android/iOS viable; cross-platform rules in `tech.md`.
- **Mock-first, adapter-bounded**: every new domain (onboarding, billing, AI, events,
  notifications) ships behind a typed adapter/service seam with a mock implementation, so
  real providers slot in later without UI rework.
- **Branch + PR only; never modify `Theme/`.**

## Execution principle
Build in the **roadmap order** (`roadmap.md`, Phases 0–13) to minimize rework: mock UI and
data models first, adapter boundaries next, backend/proxy + real integrations last and only
after security review. Do not jump ahead to real credentials, mutations, or providers.
