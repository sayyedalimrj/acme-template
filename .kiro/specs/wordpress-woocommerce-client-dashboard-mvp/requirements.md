# Requirements — WordPress/WooCommerce Client Dashboard (MVP)

Spec: `wordpress-woocommerce-client-dashboard-mvp`

## Introduction

This document defines the requirements for the MVP of a **production-grade** management
dashboard that lets **our clients** operate their own WordPress/WooCommerce websites. The
app is built **React Native first** (Expo + React Native + React Native Web, TypeScript,
Expo Router); the first deliverable is a **web app**, with architecture preserved for
future Android and iOS builds.

The clients' **end-customers do not use this app** — they keep using the public
WooCommerce storefront. An internal dashboard for our own business is out of scope.

The MVP runs entirely on **mock services behind adapter interfaces**. No real
WooCommerce/WordPress writes occur until the mock UI, adapter interfaces, and security
model are reviewed and approved (see `.kiro/steering/security.md`).

### Definitions
- **Client / user:** the authenticated person using this dashboard to manage one or more
  stores.
- **Site / store:** a connected WordPress + WooCommerce website.
- **Active site:** the site currently selected as the working context.
- **Adapter:** the typed interface that abstracts a data source (mock now, real
  WooCommerce/WordPress later).

### EARS notation
Acceptance criteria use EARS phrasing (WHEN/IF … THE SYSTEM SHALL …).

---

## Requirement 1 — App shell & navigation

**User story:** As a client, I want a clear, responsive dashboard shell so that I can
navigate between modules efficiently on any device.

**Acceptance criteria**
1. WHEN the app loads on web at a wide viewport, THE SYSTEM SHALL display a persistent
   sidebar and a topbar with the active-site indicator and user menu.
2. WHEN the viewport is narrow (mobile width) or running on a native platform, THE SYSTEM
   SHALL present mobile-friendly navigation (e.g. drawer or tab navigation) instead of a
   persistent sidebar.
3. THE SYSTEM SHALL build all layout from React Native primitives only (no DOM elements),
   so the shell renders on Web, Android, and iOS.
4. THE SYSTEM SHALL be RTL-ready: WHEN the active direction is RTL, navigation and layout
   SHALL mirror correctly.
5. THE SYSTEM SHALL be dark/light-ready: layout and components SHALL read colors from
   theme tokens and support both modes without code changes per screen.
6. WHEN a user selects a navigation destination, THE SYSTEM SHALL route via Expo Router
   without a full reload and reflect the active destination state.

---

## Requirement 2 — Auth / session foundation

**User story:** As a client, I want to sign in and have my session protect the dashboard
so that only authenticated users reach management screens.

**Acceptance criteria**
1. THE SYSTEM SHALL provide a sign-in screen using a **local/mock auth** provider for the
   MVP.
2. WHEN a user is not authenticated and navigates to a protected route, THE SYSTEM SHALL
   redirect to the sign-in screen.
3. WHEN a user authenticates successfully, THE SYSTEM SHALL establish a session and grant
   access to protected routes.
4. WHEN a user signs out, THE SYSTEM SHALL clear the session and return to the sign-in
   screen.
5. THE SYSTEM SHALL expose a single auth boundary/interface so a real auth provider can
   replace the mock later without changing screens.
6. THE SYSTEM SHALL NOT store any production credentials or secrets in the frontend
   (per `security.md`); only safe session/preference data may persist.

---

## Requirement 3 — Connect site

**User story:** As a client, I want to connect my WordPress/WooCommerce site so that the
dashboard can manage its data, while keeping my credentials secure.

**Acceptance criteria**
1. THE SYSTEM SHALL let a user enter a WordPress **site URL** and begin a WooCommerce
   connection flow.
2. THE SYSTEM SHALL display **connection status** per site (e.g. connected, disconnected,
   error, pending).
3. THE SYSTEM SHALL provide a **disconnect / revoke** action that clears the site
   connection from the active context.
4. WHEN the connection flow references credentials, THE SYSTEM SHALL clearly state that
   WooCommerce keys/secrets and WordPress application passwords are handled by a
   **backend/proxy in production** and SHALL NOT accept or persist real production secrets
   in the frontend.
5. THE SYSTEM SHALL keep connections **isolated per site** and associate the active-site
   context with a non-secret site reference only.
6. WHEN multiple sites are connected, THE SYSTEM SHALL let the user switch the active site,
   and all modules SHALL reflect the active site's data.
7. THE SYSTEM SHALL display **security warnings** in any UI that mentions credentials.

---

## Requirement 4 — Dashboard overview

**User story:** As a client, I want an at-a-glance overview of my store so that I can
understand performance quickly.

**Acceptance criteria**
1. WHEN the dashboard loads for the active site, THE SYSTEM SHALL display key metrics:
   sales (revenue), orders, products, and customers counts/totals for a default period.
2. THE SYSTEM SHALL display a **recent orders** widget with order number, customer,
   status, total, and date.
3. THE SYSTEM SHALL display a **top products** widget.
4. THE SYSTEM SHALL display an **activity/status** widget (e.g. recent activity or store
   status indicators).
5. WHILE data is loading, THE SYSTEM SHALL show loading states; IF a data request fails,
   THE SYSTEM SHALL show an error state with a retry affordance; IF there is no data,
   THE SYSTEM SHALL show an empty state.
6. THE SYSTEM SHALL source all metrics from the **mock service** via adapter interfaces,
   using realistic WooCommerce-like data.

---

## Requirement 5 — Products

**User story:** As a client, I want to manage my store's products so that I can keep the
catalog accurate.

**Acceptance criteria**
1. THE SYSTEM SHALL display a **product list** with name, SKU, price, stock status, and
   categories.
2. THE SYSTEM SHALL provide **search and filter** (e.g. by name/SKU, status, category).
3. WHEN a user selects a product, THE SYSTEM SHALL show a **product detail** view.
4. THE SYSTEM SHALL provide **create** and **edit** forms with validation
   (react-hook-form + zod).
5. WHEN a user requests deletion, THE SYSTEM SHALL show a **delete confirmation** before
   removing the product.
6. THE SYSTEM SHALL perform all reads/writes through a **mock product service** behind a
   **WooCommerce product adapter interface**; no real WooCommerce writes in the MVP.
7. WHILE loading / on error / when empty, THE SYSTEM SHALL show appropriate states.

---

## Requirement 6 — Orders

**User story:** As a client, I want to view and process orders so that I can fulfill
customer purchases.

**Acceptance criteria**
1. THE SYSTEM SHALL display an **order list** with order number, customer, status, total,
   and date.
2. THE SYSTEM SHALL provide filters by **status**, **date**, and **customer**.
3. WHEN a user selects an order, THE SYSTEM SHALL show an **order detail** view with line
   items, totals, customer, and status history.
4. THE SYSTEM SHALL provide a **status update** UI for an order (e.g. processing →
   completed), operating against the mock service only in the MVP.
5. THE SYSTEM SHALL perform all reads/writes through a **mock order service** behind a
   **WooCommerce order adapter interface**; no real WooCommerce writes in the MVP.
6. WHILE loading / on error / when empty, THE SYSTEM SHALL show appropriate states.

---

## Requirement 7 — Customers / users

**User story:** As a client, I want to see my customers so that I can understand and
support them.

**Acceptance criteria**
1. THE SYSTEM SHALL display a **customer list** with name, email, orders count, and total
   spend.
2. WHEN a user selects a customer, THE SYSTEM SHALL show a **customer detail** view.
3. THE SYSTEM SHALL include an **order-history placeholder** within customer detail
   (wired to mock data, ready for real linkage later).
4. THE SYSTEM SHALL read through a **mock customer service** behind a
   **WooCommerce/WordPress customer adapter interface**.
5. WHILE loading / on error / when empty, THE SYSTEM SHALL show appropriate states.

---

## Requirement 8 — Settings

**User story:** As a client, I want a settings area so that I can review my connection and
app preferences.

**Acceptance criteria**
1. THE SYSTEM SHALL show **site connection status** for the active site (and a path to
   connect/disconnect).
2. THE SYSTEM SHALL provide a **theme preference placeholder** (light/dark/system).
3. THE SYSTEM SHALL provide a **language / RTL placeholder**.
4. THE SYSTEM SHALL provide general **app preferences**.
5. THE SYSTEM SHALL display **security warnings** wherever credentials are referenced,
   reflecting the backend/proxy requirement and "no secrets in frontend" rule.

---

## Requirement 9 — Cross-platform & quality (cross-cutting)

**User story:** As the product owner, I want the MVP engineered seriously so that it scales
to native platforms and production.

**Acceptance criteria**
1. THE SYSTEM SHALL avoid browser globals (`window`, `document`, `localStorage`), raw DOM
   elements, React DOM routers, Vite, and DOM-only libraries in shared code.
2. THE SYSTEM SHALL keep all data access behind **service + adapter** layers; screens
   SHALL NOT call `fetch` directly.
3. THE SYSTEM SHALL use a single, documented **design-system** (tokens + primitives) and a
   single styling approach (per `tech.md`).
4. THE SYSTEM SHALL use realistic **WooCommerce-like domain models** for all mock data.
5. THE SYSTEM SHALL be delivered through **pull requests**; no direct pushes to `master`.
6. THE SYSTEM SHALL NOT modify anything under `Theme/`.

---

## Non-goals (out of scope for this MVP)

- No end-customer / shopper dashboard.
- No payment processing.
- No theme builder.
- No pixel-perfect Ecme clone; no direct modification of Ecme under `Theme/`.
- No production secrets in the frontend or in git.
- No native-only features in the first web MVP.
- No internal admin dashboard for our own business yet.
- No real WooCommerce writes until mock UI, API adapters, and security model are reviewed.
