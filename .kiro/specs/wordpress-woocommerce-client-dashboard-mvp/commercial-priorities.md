# Commercial Priorities

Short, actionable backlog priorities for the WooCommerce client dashboard, informed by
mature commerce/admin products. This guides what the adapter/service foundation must enable
next — not a feature spec.

## Inspirations → what we borrow (concepts only)

- **Shopify** — an "operating home": real-time store metrics, urgent action items, and
  order/inventory/fulfillment awareness at a glance.
- **Wix** — key analytics (stats, product sales, conversion funnel) and roles/permissions
  for future team access; abandoned-cart recovery later.
- **Squarespace** — mobile-first operations: fulfill orders, manage inventory, resolve
  customer issues, react to low/out-of-stock alerts.
- **BigCommerce** — catalog/order depth: categories, brands, coupons/discounts, shipping
  data, bulk pricing and multi-currency readiness.

## Priorities

### P0 — reliable core (now / next modules)
- Active **site context** everywhere (multi-site).
- Solid **dashboard overview** (sales, orders, products, customers, fulfillment, action items).
- **Products**, **Orders**, **Customers** read flows on the mock→adapter→service foundation.
- Urgent **action items** (low/out-of-stock, pending/on-hold orders).

### P1 — operational depth
- **Inventory alerts** and thresholds; restock workflows.
- **Fulfillment workflow** (mark fulfilled/partial, shipping/tracking).
- **Role/permission model** (owner/manager/staff) — modeled now, enforced later.
- **Analytics improvements** (trends, conversion funnel).

### P2 — growth & collaboration
- **Abandoned carts** + recovery.
- **Multi-currency** end-to-end.
- **Coupons/discounts** management.
- **Reports/exports**.
- **Team collaboration** (invites, audit trail).

## Foundation implications (this task)

Domain types and adapter contracts already model: brands, categories, fulfillment/shipping,
action items, abandoned-cart summary, multi-currency fields, and role/permission placeholders
— so the above can be built as real features without reshaping the data layer. All mutations
that touch a real store remain gated on the backend/proxy + security review.
