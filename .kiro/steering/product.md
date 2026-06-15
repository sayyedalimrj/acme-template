---
inclusion: always
---

# Product Steering — WordPress/WooCommerce Client Dashboard

## What we are building

A serious, commercial-grade **management dashboard that lets our clients operate their
own WordPress/WooCommerce websites** from a single, well-designed application.

The product is built **React Native first** (Expo + React Native + React Native Web,
TypeScript, Expo Router). The first deliverable is a **web app MVP**, but every decision
must keep Android and iOS builds viable without a rewrite.

## Who the users are

- **Primary users — our clients.** Business owners / operators who run one or more
  WordPress + WooCommerce stores. They log into this app to view metrics and manage
  products, orders, customers, and site connections.
- **NOT users of this app — the clients' end-customers (shoppers).** They keep using the
  normal public WordPress/WooCommerce storefront. This app never renders an
  end-customer-facing shopping experience.

## Business framing

- A single client may connect and manage **multiple** WordPress/WooCommerce sites.
- The app is a **control surface over the WooCommerce/WordPress REST APIs**, not a
  re-implementation of the storefront or checkout.
- An internal dashboard for **our own** business may be added later. It is explicitly
  **out of scope for the first MVP**.

## MVP scope (modules)

1. **App shell** — responsive dashboard layout; sidebar/topbar on web; mobile-friendly
   navigation for native; RTL-ready and dark/light-ready structure.
2. **Auth/session foundation** — local/mock auth first, protected routes, a clean
   boundary for future real auth, no insecure production credential storage.
3. **Connect site** — WordPress site URL, WooCommerce connection flow, connection status,
   disconnect/revoke concept, production backend/proxy requirement.
4. **Dashboard overview** — sales/orders/products/customers metrics, recent orders,
   top products, activity/status widgets.
5. **Products** — list, search/filter, detail, create/edit form, delete confirmation;
   mock service first; future WooCommerce adapter interface.
6. **Orders** — list, status/date/customer filters, detail, status update UI; mock
   service first; future WooCommerce adapter interface.
7. **Customers/users** — list, detail, order-history placeholder; mock service first;
   future WooCommerce/WordPress adapter interface.
8. **Settings** — site connection status, theme preference placeholder, language/RTL
   placeholder, app preferences, security warnings for credentials.

## Non-goals (explicit)

- No end-customer / shopper dashboard.
- No payment processing.
- No theme builder.
- No pixel-perfect Ecme clone and no direct modification of Ecme under `Theme/`.
- No production secrets stored in the frontend or committed to git.
- No native-only features in the first web MVP.
- No internal admin dashboard for our own business yet.
- No real WooCommerce writes until the mock UI, API adapter interfaces, and security
  model have been reviewed and approved.

## Product principles

- **Cross-platform by default.** Web today; Android/iOS tomorrow with the same codebase.
- **Multi-site, multi-tenant aware.** Site context is a first-class concept everywhere.
- **Secure by design.** Sensitive credentials never live in the frontend (see
  `security.md`).
- **Inspired, not copied.** Ecme informs layout, UX, and design-token ideas only
  (see `ecme-reference.md`).
- **Production-grade MVP.** Limited in scope, engineered seriously (see `quality-bar.md`).
