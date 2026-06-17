# Seed Strategy (design record)

> **Status: design record only.** No seed runs in this PR (there is no database). This
> describes how **development-only** seed data will be produced once the adapter boundary and
> a dev store exist.

## Principles

- **Dev/test only.** Seeds run exclusively against local/dev environments — never production.
- **No real data.** No real PII, no real emails/phones, no real customer domains, no real
  secrets, no real payment data.
- **Deterministic later.** Seed data will be generated deterministically (fixed ids/seeded
  RNG) so dev environments and tests are reproducible.
- **Safe domains only.** Any URLs use reserved example/test domains (e.g. `example.com`,
  `example.test`) — never a real store domain.

## What dev seeds will include

- **Fake tenants** — a few tenants across plans (Starter/Growth/Pro/Managed).
- **Fake sites** — one or more sites per tenant on `example.test` URLs, various statuses.
- **Fake sync runs** — sample `sync_runs` with small product/order/customer/event counts.
- **Fake synced summaries** — a handful of `synced_products` / `synced_orders` /
  `synced_customers` rows (generic labels only; no PII).
- **Fake support conversations** — a few `support_conversations` + redacted `support_messages`.
- **Fake subscriptions** — `subscriptions` referencing seeded `plans` (provider refs are
  placeholder labels only, never real provider ids).
- **Fake workflow items** — sample `workflow_items` across statuses.

## What seeds must NEVER include

- Real or realistic PII (names, emails, phone numbers, addresses).
- Any secret, key, password, token, or vault material.
- Payment card data of any kind.
- Real store/customer domains or real provider identifiers.

## Mechanics (later)

- Seeds will be expressed as typed factories producing the schema record types
  (`schemaDesign.ts`) and inserted through the future repository/adapter boundary, not via
  raw SQL.
- A single idempotent `seedDev()` entry point will reset + populate the dev store; it will
  refuse to run unless an explicit dev flag is set.
