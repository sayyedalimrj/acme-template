# Deployment & Go‑Live Guide

This is the end‑to‑end, step‑by‑step guide for taking this project to production. It is honest
about what runs **today** and what must be **built/wired** before a real go‑live, and it never
asks you to put secrets in git or in the frontend bundle (see `.kiro/steering/security.md`).

> Read this together with:
> - **`SERVER_SETUP.fa.md`** — **راهنمای قدم‌به‌قدم فارسی** برای VPS (Ubuntu + Nginx + SSL + systemd)
> - `PORTALS.md` — the three role-based experiences (merchant / admin / affiliate) in one build
> - `apps/client/README.md` — the frontend app
> - `services/api/README.md` — the runnable OTP/RBAC backend (`services/api`)
> - `apps/api/README.md` + `apps/api/src/database/README.md` — the backend/proxy + DB design
> - `wordpress-plugin/README.md` + `wordpress-plugin/SECURITY.md` — the WordPress companion

---

## راهنمای سریع (خلاصه فارسی)

این پروژه سه بخش دارد:

1. **`apps/client`** — اپ داشبورد (Expo + React Native Web). همین حالا به‌صورت **PWA وب** قابل
   اجرا و انتشار است و روی **داده‌ی ماک** کار می‌کند (هنوز به سرور واقعی وصل نیست).
2. **`apps/api`** — لایه‌ی بک‌اند/پراکسی امن. در حال حاضر فقط **طراحی و قراردادها (types)** است و
   **سرور اجرایی ندارد**؛ برای اتصال واقعی باید پیاده‌سازی شود.
3. **`wordpress-plugin`** — افزونه‌ی همراه وردپرس برای **همگام‌سازی امن فقط‑خواندنی** فروشگاه
   ووکامرس.

**برای راه‌اندازی همین امروز (فقط فرانت‌اند، روی داده‌ی نمونه):**

```bash
cd apps/client
npm install
npm run web          # اجرای محلی در مرورگر
npm run export:web   # خروجی استاتیک در ./dist برای انتشار (مثلاً روی Vercel)
```

**برای رفتن به حالت واقعی (اتصال به فروشگاه‌ها + پرداخت):**
باید بک‌اند `services/api` را با Postgres و ippanel روی سرور بالا بیاورید و سه ساب‌دامین جدا
بیلد کنید. **راهنمای قدم‌به‌قدم فارسی:** `SERVER_SETUP.fa.md`. جزئیات فنی انگلیسی در بخش‌های
پایین همین فایل (`DEPLOYMENT.md`) آمده است.

> امنیت (مهم): هیچ کلید/رمز فروشگاه یا درگاه پرداخت **هرگز** نباید داخل فرانت‌اند یا داخل گیت
> قرار بگیرد. همه‌ی کلیدها فقط در متغیرهای محیطی سمت سرور (Secret Manager) نگه‌داری می‌شوند.

---

## 0) Architecture at a glance

```
┌─────────────────┐     HTTPS (frontend-safe data only)      ┌──────────────────────────┐
│  apps/client     │  ───────────────────────────────────▶   │  apps/api (backend/proxy) │
│  Expo RN Web PWA │  ◀───────────────────────────────────   │  + Postgres + vault       │
└─────────────────┘                                          └────────────┬─────────────┘
        ▲                                                                  │ signed, server-side
        │ install / connect                                               ▼
        │                                              ┌───────────────────────────────────┐
        │                                              │ Merchant WordPress / WooCommerce    │
        └───────── PWA install on phone/desktop        │ + wordpress-plugin (companion)      │
                                                       └───────────────────────────────────┘
                                                       Payment provider (Stripe / Zarinpal / …)
                                                       is called ONLY by apps/api, server-side.
```

| Component          | Status today                              | Needed for go‑live                                  |
| ------------------ | ----------------------------------------- | --------------------------------------------------- |
| `apps/client`      | ✅ 3 portal builds (merchant/admin/affiliate); **real backend data + phone-OTP login** when `EXPO_PUBLIC_API_BASE_URL` is set (mock otherwise) | Set `EXPO_PUBLIC_PORTAL` + `EXPO_PUBLIC_API_BASE_URL` per subdomain |
| `services/api`     | ✅ **Production backend**: OTP+JWT+refresh, granular RBAC + tenant/site isolation, AES-256-GCM credential vault, **WooCommerce REST proxy**, **plugin signed sync**, webhooks, billing, audit | Provide DB + secrets + ippanel/gateway keys; deploy |
| `apps/api`         | 🟡 Design/contracts reference (the runnable backend lives in `services/api`) | Optional: keep as reference; no deploy needed       |
| Database           | ✅ Ordered, tracked Postgres migrations (`services/api/db/migrations/`) | Provision Postgres, run `npm run migrate`           |
| Payments           | ✅ Gateway adapter (manual/mock/zarinpal) + checkout→verify + idempotent billing events | Configure `BILLING_PROVIDER` + provider keys        |
| `wordpress-plugin` | ✅ Production companion: settings + **HMAC-signed handshake/sync** + WP-cron + sync-now | Install on the merchant site, paste connection + signing secret |

> **Three subdomains:** the client is deployed **three times** — one per portal — each fixed to a
> portal via `EXPO_PUBLIC_PORTAL` and pointed at the one backend via `EXPO_PUBLIC_API_BASE_URL`.
> See `PORTALS.md` and "Part S" below.

---

## 1) Prerequisites

- **Node.js 18+** (developed on Node 22) and **npm 9+**.
- Git, and a deploy target for static hosting (Vercel is preconfigured via `apps/client/vercel.json`).
- For the backend (go‑live): a Node host (Vercel/Render/Fly/AWS/etc.), a **managed Postgres**
  (Neon, Supabase, Vercel Postgres, RDS/Aurora — see `apps/api/src/database/dbProviderDecision.md`),
  a **secret manager**, and a payment provider account.
- For the WordPress side: a WooCommerce store you control + ability to install a plugin.

---

## Part A — Frontend (`apps/client`)

### A1. Install & run locally

```bash
cd apps/client
npm install
npm run web        # opens the app in your browser (Metro bundler; NOT Vite)
```

### A2. Quality gates (run before every deploy)

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test:ci    # jest
```

All three must pass. (At the time of writing: typecheck ✅, lint ✅, 235 tests ✅.)

### A3. Build the static web app (PWA)

```bash
npm run export:web   # = expo export -p web && node scripts/pwa-postbuild.mjs
```

Output goes to `apps/client/dist/` (gitignored). The post‑build step wires the PWA (manifest,
icons, service worker, iOS viewport) and sets the document shell.

> **RTL note (important):** the app renders Persian RTL **itself** in JS (direction‑aware flex
> rows + explicit `textAlign`), with a deterministic **LTR ambient** on every platform. The
> exported `index.html` is therefore `<html lang="fa" dir="ltr">` **on purpose**. Do **not**
> change it back to `dir="rtl"` — that double‑flips the layout and mirrors the whole UI (the
> bug that broke the header, bottom nav, filter chips, product rows, and the hero carousel/swipe
> on the deployed build). Native is locked to LTR ambient in `app/_layout.tsx` for the same
> reason.

### A4. Deploy the frontend

**Vercel (preconfigured):**

- `apps/client/vercel.json` already sets `buildCommand` and `outputDirectory: dist` with SPA
  rewrites and clean URLs.
- Set the **Root Directory** of the Vercel project to `apps/client`.
- Deploy. No secrets are required for the frontend (and none must ever be added there).

**Any static host (Netlify, S3+CloudFront, Nginx, etc.):**

- Build with `npm run export:web` and serve `apps/client/dist/`.
- Add an SPA fallback so all routes serve `/index.html` (Expo Router uses client routing).
- Serve over **HTTPS** (required for service workers / PWA install).

### A5. Switch the app from mock data to the real backend (at go‑live)

The data source is now **automatic**: `apps/client/src/config/app.config.ts` selects `http` when
`EXPO_PUBLIC_API_BASE_URL` is set at build time, and `mock` otherwise. There is nothing to edit:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.example.com EXPO_PUBLIC_PORTAL=merchant npm run export:web:merchant
```

- With no `EXPO_PUBLIC_API_BASE_URL`, the app runs entirely on in-memory mock data (great for demos
  and tests).
- With it set, the three portals call the real backend for login (OTP + refresh) and data:
  merchant store data (products/orders/customers/coupons/reports via the server-side WooCommerce
  proxy), admin platform data, and affiliate referrals/commissions/payouts.
- The frontend talks **only** to `services/api`, never directly to a merchant store, and never
  holds store/payment secrets. WooCommerce keys are entered once on the Connect-Site screen and go
  straight to the backend vault (HTTPS) — they are never persisted in the app.
- A few AI/ops surfaces (advisor, media studio, intelligence, automation, support inbox, plan
  display) have no production backend yet and remain on in-memory demo data even in `http` mode;
  they are clearly isolated and non-critical.

---

## Part S — Three subdomains + phone‑OTP backend (recommended setup)

> **Persian VPS walkthrough:** see **`SERVER_SETUP.fa.md`** (Ubuntu 24.04, Postgres, Nginx, Certbot,
> systemd, ippanel). Example configs: `services/api/deploy/`.

This is the concrete path to deploy the three portals on three subdomains with **real OTP login**.

### S1. Run the backend (`services/api`)

```bash
cd services/api
cp .env.example .env            # set JWT_SECRET, OTP_HASH_SECRET (openssl rand -hex 32)
npm install
npm run db:up                   # Postgres via docker compose (or use a managed DB + DATABASE_URL)
npm run migrate -- --seed       # apply schema + demo rows
npm run dev                     # http://localhost:8080
```

Enable real SMS by setting the ippanel keys in `.env` and `SMS_DRY_RUN=false` (see
`services/api/README.md`). Set `ADMIN_MOBILE_ALLOWLIST` to the mobiles allowed into the admin
portal. Set `CORS_ORIGINS` to your three subdomains.

### S2. Build & deploy the three frontends

```bash
cd apps/client
# Set the backend origin for each build (the API that sends OTP + serves data):
EXPO_PUBLIC_API_BASE_URL=https://api.example npm run export:web:merchant   # → dist-merchant
EXPO_PUBLIC_API_BASE_URL=https://api.example npm run export:web:admin      # → dist-admin
EXPO_PUBLIC_API_BASE_URL=https://api.example npm run export:web:affiliate  # → dist-affiliate
```

Deploy each `dist-*` folder to its subdomain (e.g. Vercel project per subdomain with the matching
`EXPO_PUBLIC_PORTAL` + `EXPO_PUBLIC_API_BASE_URL` build env, or any static host with an SPA
fallback to `/index.html`):

| Subdomain         | Folder           | Build env                                            |
| ----------------- | ---------------- | ---------------------------------------------------- |
| `app.example`     | `dist-merchant`  | `EXPO_PUBLIC_PORTAL=merchant`                        |
| `admin.example`   | `dist-admin`     | `EXPO_PUBLIC_PORTAL=admin`                           |
| `partner.example` | `dist-affiliate` | `EXPO_PUBLIC_PORTAL=affiliate`                       |

All three set `EXPO_PUBLIC_API_BASE_URL=https://api.example`.

### S3. Phone‑OTP flow (ippanel)

1. App → `POST {api}/auth/otp/request { mobile, portal }` → backend stores a **hashed** code and
   sends it via ippanel (or logs it in dry‑run).
2. App → `POST {api}/auth/otp/verify { mobile, code, portal }` → backend verifies, creates/looks
   up the user, assigns the role, and returns a **JWT** + user.
3. The app stores the JWT in memory and is signed in. `GET {api}/auth/me` returns the session.

Security: codes are short‑lived, single‑use, attempt‑limited, and per‑mobile rate‑limited; only a
salted hash is stored. The ippanel API key lives **only** in backend env.

### S4. RBAC & data‑access matrix (enforced server‑side)

| Role        | Portal       | Can read                                              | Cannot                          |
| ----------- | ------------ | ---------------------------------------------------- | ------------------------------- |
| `merchant`  | merchant     | only their own store (`/merchant/*`)                 | other merchants, admin, payouts |
| `affiliate` | affiliate    | only their own referrals/commissions (`/affiliate/*`)| other marketers, admin          |
| `admin`     | admin        | everything (`/admin/*`, and all the above)           | —                               |

The JWT carries the role; each route requires the matching role (`services/api/src/auth/rbac.ts`).
A merchant token calling `/admin/*` gets `403`. Admin login is restricted to
`ADMIN_MOBILE_ALLOWLIST`.

### S5. Database

`services/api/db/migrations/` holds ordered, tracked Postgres migrations (users, OTP, sessions,
tenants + members, sites + connections + **encrypted credentials**, sync read-models, webhook +
plugin events, replay nonces, plans/subscriptions/billing, marketers/referrals/commissions/
payouts, audit log). Apply with `npm run migrate` (idempotent; re-runnable). Money is stored as
integer minor units; **no card data and no raw secrets** are ever stored. Rollback guidance:
`services/api/db/migrations/ROLLBACK.md`.

---

## Part W — Connect a merchant's WooCommerce store

Two server-side connection modes (the frontend never holds store keys):

### Mode A — WooCommerce REST credentials (direct)

1. Merchant opens the merchant portal → **Connect site**, enters the store name + URL, and (with a
   live backend) the WooCommerce **consumer key + secret**.
2. In WooCommerce: **WooCommerce → Settings → Advanced → REST API → Add key** (Read/Write).
3. The backend verifies the keys against the store, seals them in the AES‑256‑GCM vault, marks the
   site **connected**, and runs an initial sync. Merchant data then loads from the server-side
   WooCommerce proxy.
4. (Optional realtime) `POST /merchant/sites/:id/webhook-secret` returns a secret + delivery URL;
   add a WooCommerce webhook (Settings → Advanced → Webhooks) to that URL using that secret. The
   backend verifies the `x-wc-webhook-signature` HMAC and updates the read-model idempotently.

### Mode B — WordPress companion plugin (signed sync)

1. Merchant opens **Connect site → Plugin mode**. The backend returns `siteId`, `tenantId`, a
   one-time **signing secret**, and the plugin delivery base URL.
2. Install `wordpress-plugin/` on the store, open **WordPress Commerce OS → Backend connection**,
   and paste the backend URL (`https://api.example.com/plugin`), site id, tenant id, and signing
   secret. Click **Connect (handshake)**.
3. The plugin signs every request (HMAC‑SHA256 over the exact body + timestamp + nonce). The
   backend verifies the signature, timestamp window, and nonce (replay protection), then persists
   the normalized read-model. A WP‑cron job syncs hourly; **Sync now** triggers it on demand.

Verify a connection: `GET /merchant/sites/:id/status` (shows connection + last sync run); the
admin portal shows all sites + sync runs and can trigger a resync.

---

## Part X — Production checklist (go‑live)

- [ ] `services/api` deployed on `api.example.com` behind HTTPS (Nginx reverse proxy).
- [ ] Postgres provisioned; `npm run migrate` applied (no `--seed` in production).
- [ ] Secrets set: `JWT_SECRET`, `OTP_HASH_SECRET`, `CREDENTIAL_ENCRYPTION_KEY` (32‑byte),
      `ADMIN_MOBILE_ALLOWLIST`, ippanel keys, billing keys, `PAYMENT_WEBHOOK_SECRET`.
- [ ] `CORS_ORIGINS` = exactly the three portal origins (`https://app…,https://admin…,https://partner…`).
- [ ] `SMS_DRY_RUN=false` with valid ippanel pattern/originator.
- [ ] Three frontend builds deployed per subdomain with `EXPO_PUBLIC_PORTAL` + `EXPO_PUBLIC_API_BASE_URL`.
- [ ] No secrets in git or the frontend bundle; quality gates pass (typecheck/lint/test/build).
- [ ] OTP login works on each portal; non-admin token → 403 on `/admin/*` (RBAC verified).
- [ ] At least one WooCommerce store connected (REST or plugin) and showing real data.

---

## Part B — Backend / Proxy (`apps/api`)

> **Current status:** `apps/api` is **interface‑first and dependency‑free** — TypeScript
> contracts, security helpers, pure validators, and not‑implemented stubs. There is **no HTTP
> server, no DB client, and no real network call** yet, by deliberate design (security review
> gate). Going live means implementing a server behind these contracts.

### B1. What to build

1. **Server runtime** — Express/Fastify/Nest (pick one). Mount routes for the contracts in
   `apps/api/src/routes/contracts.ts` and wire the adapters:
   - WooCommerce reads → `WooCommerceProxy` (`src/adapters/woocommerceProxy.ts`)
   - Site ownership/connect → `WordPressBridge` (`src/adapters/wordpressBridge.ts`)
   - Inbound store webhooks → `WebhookReceiver` (`src/adapters/webhookReceiver.ts`)
   - Plugin signed sync delivery → `handlePluginSyncDelivery` (`src/plugin/pluginDeliveryEndpoint.ts`)
   - Platform billing → `PaymentGateway` (`src/adapters/paymentGateway.ts`)
   The provided `createNotImplemented…()` stubs return safe errors and are safe to mount first,
   then replace one method at a time.
2. **Auth** — real authentication + sessions for the merchant users (`ApiUser`/`ApiRole`), and
   enforce RBAC using `checkPermission` (`src/domain/permission.ts`) on every privileged route.
3. **Credential vault** — encrypted‑at‑rest, per‑site secret storage with rotation/revocation.
   The skeleton stores **metadata only** (`buildCredentialMetadata`); the real secret lives in
   the vault/KMS and is referenced, never returned to the client.
4. **Tenant isolation** — apply `assertTenantScope` / `assertSiteScope`
   (`src/database/tenantIsolation.ts`) + DB row‑level security (see Part C).
5. **Output safety** — pass every response through the redaction helpers
   (`src/security/redaction.ts`) so secrets/PII can never leak.

### B2. Backend environment variables (set in your host's secret manager — never in git)

Names only (see `apps/api/src/database/environmentContract.md`):

| Name                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`                | Primary Postgres connection reference                        |
| `DATABASE_READONLY_URL`       | Optional read‑replica for read‑heavy queries                 |
| `DATABASE_MIGRATION_URL`      | Optional elevated connection used only by the migration runner|
| `ENCRYPTION_KEY_REF`          | Vault/KMS **reference** to the encryption key (not the key)  |
| `SIGNING_SECRET_PROVIDER_REF` | Vault **reference** to the plugin signing‑secret provider    |

Plus (added at their integration phases, names only — values via the secret manager):

| Name                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `PAYMENT_PROVIDER`            | Which gateway is active (`stripe` / `zarinpal` / …)          |
| `PAYMENT_API_KEY_REF`         | Vault reference to the provider secret key                   |
| `PAYMENT_WEBHOOK_SECRET_REF`  | Vault reference to the provider webhook signing secret       |
| `PAYMENT_RETURN_URL`          | Backend callback URL the gateway redirects back to           |

> **Rules:** names only in the repo; **no `.env` committed**; secret material lives in a
> vault/KMS and the backend reads **references**, never raw secrets; nothing sensitive is ever
> shipped to the frontend.

---

## Part C — Database

The full schema, isolation, retention, and migration plan already exist as **typed
descriptors** under `apps/api/src/database/` (no SQL is executed by importing them).

### C1. Choose a provider

Use a **managed, Postgres‑compatible** database (relational fits the `Tenant → Site → Resource`
model with strong FKs and per‑tenant isolation). Candidates and selection criteria are in
`apps/api/src/database/dbProviderDecision.md` (Neon, Supabase, Vercel Postgres, RDS/Aurora).

### C2. Provision & connect

1. Create the database; capture its connection string into `DATABASE_URL` (secret manager).
2. Enable **row‑level security (RLS)** and/or enforce the query‑layer tenant guard.
3. Configure automated **backups** and **point‑in‑time recovery**.

### C3. Run the migrations

The ordered manifest is `apps/api/src/database/migrations/migrationManifest.ts`
(`001_initial_platform_schema` → `004_security_audit_usage`). These are **descriptors**, so:

1. Implement a small migration runner (or generate SQL) that consumes `MIGRATION_MANIFEST` in
   order. The descriptors include tables, columns, indexes, constraints, rollback plans, and
   safety checks.
2. Apply migrations using `DATABASE_MIGRATION_URL` (elevated), then run the app on `DATABASE_URL`.
3. Enforce the invariants the scaffold checks: every tenant‑scoped table has `tenantId`,
   site‑scoped tables have `siteId`+`tenantId`, sync tables have `syncRunId`, and there are
   **no raw‑secret / raw‑payload columns**.

See `apps/api/src/database/migrations/README.md`, `seedStrategy.md`, `rollbackStrategy.md`, and
`tenantIsolationChecklist.md`.

### C4. Financial data rules

- `SubscriptionRecord`, `PlanRecord`, `UsageCounterRecord`, and `BillingEventRecord` hold
  **provider metadata and display labels only** — **never** card/PAN data.
- A settled payment becomes a `BillingEventRecord` (`invoice_paid` / `payment_failed` / …) with
  an opaque `providerEventRef`; the gateway's secrets stay server‑side.

---

## Part D — Payments (platform subscription billing)

> Scope: this is how **the platform charges a tenant for its plan**. A merchant's own store
> checkout stays inside their WooCommerce site and is not handled here.

The contract is `apps/api/src/adapters/paymentGateway.ts` (`PaymentGateway`), provider‑agnostic
and built around the universal **create → redirect → verify** flow that fits both Stripe Checkout
and Iranian gateways (Zarinpal, IDPay, NextPay).

### D1. Implement one provider server‑side

1. Implement `PaymentGateway` (replace `createNotImplementedPaymentGateway()`):
   - `createCheckout(req, ctx)` → call the provider with the **server‑side** key, return a
     `redirectUrl` + opaque `providerRef`. Amounts are integer **minor units** + ISO‑4217
     currency. **Never** accept card data.
   - `verifyPayment(providerRef, ctx)` → verify on the gateway return/callback, then write a
     `BillingEventRecord` and activate/renew the `SubscriptionRecord`.
   - `getPaymentStatus`, `refundLater`, `handleWebhookLater` as needed.
2. Add a **return/callback route** (`PAYMENT_RETURN_URL`) that calls `verifyPayment` and is
   **idempotent** (use `providerEventRef`/`providerRef` to dedupe).
3. Add a **webhook route** that verifies the provider signature (replace
   `verifyPaymentWebhookSignaturePlaceholder` with real HMAC/asymmetric verification using
   `PAYMENT_WEBHOOK_SECRET_REF`) before applying any state change.

### D2. Payment security checklist

- [ ] Provider secret key only in `PAYMENT_API_KEY_REF` (vault) — never in git/frontend.
- [ ] Card capture happens on the provider's hosted page / element — never on our servers.
- [ ] Webhooks are signature‑verified and idempotent.
- [ ] Amounts are integer minor units; currency is explicit.
- [ ] Every payment action is tenant‑scoped and written to the audit log (secrets redacted).

---

## Part E — WordPress companion plugin (`wordpress-plugin`)

This PHP plugin lets a merchant connect their store for **secure, read‑only sync** and signed
delivery (and controlled actions later). See `wordpress-plugin/README.md` and `SECURITY.md`.

1. Package `wordpress-plugin/` and install/activate it on the merchant's WordPress site
   (requires WooCommerce).
2. In the plugin admin, generate/connect using the handshake (see
   `wordpress-plugin/examples/handshake-request.example.json`).
3. Share a **signing secret** between the plugin and `apps/api` via the secret manager
   (`SIGNING_SECRET_PROVIDER_REF`) — never hard‑code it.
4. The plugin signs sync packages/events (HMAC‑SHA256); `apps/api` verifies them with
   `verifyPluginSyncSignature` and a replay guard before persisting summary‑only read models.

---

## Part F — Go‑live runbook (ordered)

1. **Frontend demo** — deploy `apps/client` on mock data (Part A). Verify the PWA installs and
   the RTL layout is correct (header, bottom nav, products list + filters, hero carousel/swipe,
   login screen).
2. **Database** — provision Postgres, enable RLS/backups, run migrations (Part C).
3. **Vault/secrets** — create the secret manager entries from the env tables (Parts B & D).
4. **Backend** — implement and deploy `apps/api` (server runtime, auth, RBAC, credential vault,
   adapters), starting from the not‑implemented stubs and replacing method‑by‑method (Part B).
5. **Payments** — implement one provider + return/webhook routes; test in the provider's
   sandbox first (Part D).
6. **WordPress** — install the companion plugin on a test store, complete the handshake, confirm
   signed read‑only sync flows into the backend (Part E).
7. **Flip the frontend** — set `dataSource: 'http'` and `apiBaseUrl` in `app.config.ts`,
   redeploy `apps/client`, and verify against the live backend (Part A5).
8. **Security review** — complete the checklist below before serving real merchants.

---

## Part G — Security checklist (must pass before go‑live)

- [ ] No secrets in git (code, config, fixtures, `.env`) — anywhere.
- [ ] No secrets in the frontend bundle; the frontend talks only to `apps/api`.
- [ ] Store credentials & payment keys live encrypted in a vault; backend reads references.
- [ ] Per‑site / per‑tenant isolation enforced (RLS + `assertTenantScope`/`assertSiteScope`).
- [ ] Disconnect revokes credentials server‑side and invalidates the connection reference.
- [ ] All privileged actions are audited with secrets/PII redacted.
- [ ] All traffic over HTTPS; webhooks signature‑verified and idempotent.
- [ ] RBAC enforced server‑side on every privileged route.

---

## Part H — Troubleshooting

- **The deployed web app looks mirrored / left‑right swapped.** The document was set to
  `dir="rtl"` while the app also flips manually → double‑flip. Ensure `pwa-postbuild.mjs` emits
  `<html lang="fa" dir="ltr">` and that nothing forces `I18nManager.isRTL` to true. (Fixed in
  this repo; see the RTL note in A3.)
- **Cards/carousel don't render or swipe is broken.** Same root cause as above — the carousel
  uses a physical `row` track + `translateX`, which only behaves with an LTR ambient.
- **Big empty white area under the login form.** The auth frame now sizes to its content and is
  centered by the ScrollView (see `apps/client/src/features/auth/components/AuthFrame.tsx`).
- **Routes 404 after refresh on a static host.** Add the SPA fallback to `/index.html`.
- **Service worker / PWA install not offered.** Serve over HTTPS and confirm `manifest.json` +
  `sw.js` are reachable at the site root.
