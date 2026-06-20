# Deployment & Go‑Live Guide

This is the end‑to‑end, step‑by‑step guide for taking this project to production. It is honest
about what runs **today** and what must be **built/wired** before a real go‑live, and it never
asks you to put secrets in git or in the frontend bundle (see `.kiro/steering/security.md`).

> Read this together with:
> - **`SERVER_SETUP.fa.md`** — **راهنمای قدم‌به‌قدم فارسی** برای VPS (Ubuntu + Nginx + SSL + systemd)
> - `PORTALS.md` — the three role-based experiences (merchant / admin / affiliate) in one build
> - `apps/client/README.md` — the frontend app
> - `services/api/README.md` — the **only deployable** production backend (OTP, RBAC, vault, WooCommerce proxy, plugin sync, billing)
> - `apps/api/README.md` — **reference-only** design contracts (not deployed; see Appendix R)
> - `wordpress-plugin/README.md` + `wordpress-plugin/SECURITY.md` — the WordPress companion

---

## راهنمای سریع (خلاصه فارسی)

این پروژه سه بخش دارد:

1. **`apps/client`** — اپ داشبورد (Expo + React Native Web). سه پورتال جدا (merchant / admin /
   affiliate) به‌صورت **PWA وب** قابل انتشار است. با `EXPO_PUBLIC_API_BASE_URL` به بک‌اند واقعی
   وصل می‌شود؛ بدون آن روی داده‌ی ماک اجرا می‌شود.
2. **`services/api`** — **تنها بک‌اند قابل استقرار**. OTP، RBAC، Postgres، vault، پراکسی
   ووکامرس، همگام‌سازی افزونه، وب‌هوک و صورتحساب.
3. **`wordpress-plugin`** — افزونه‌ی همراه وردپرس برای **همگام‌سازی امن فقط‑خواندنی** فروشگاه
   ووکامرس.

> `apps/api` فقط **مرجع طراحی/قرارداد** است — سرور اجرایی ندارد و **نباید** deploy شود.

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
│  apps/client     │  ───────────────────────────────────▶   │  services/api             │
│  Expo RN Web PWA │  ◀───────────────────────────────────   │  Express + Postgres + vault│
│  (×3 subdomains) │                                          └────────────┬─────────────┘
└─────────────────┘                                                       │ signed, server-side
        ▲                                                                   ▼
        │ install / connect                              ┌───────────────────────────────────┐
        │                                                │ Merchant WordPress / WooCommerce    │
        └───────── PWA install on phone/desktop          │ + wordpress-plugin (companion)      │
                                                         └───────────────────────────────────┘
                                                         Payment provider (Zarinpal / …)
                                                         is called ONLY by services/api, server-side.
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
- For the backend (go‑live): a Node host, a **managed Postgres** (Neon, Supabase, RDS/Aurora, or
  self-hosted — see `services/api/README.md`), a **secret manager**, and a payment provider account.
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
3. The backend verifies the keys against the store (with SSRF protection), seals them in the
   AES‑256‑GCM vault, marks the site **connected**, and runs a **full paginated initial sync**
   (all WooCommerce list pages, 100 items/page — not just the first page). Merchant data then
   loads from the server-side WooCommerce proxy.
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
- [ ] `CORS_ORIGINS` = exactly the three portal origins (`https://app…,https://admin…,https://partner…`) — **server refuses to start if empty in production**.
- [ ] `SMS_DRY_RUN=false` with valid ippanel pattern/originator.
- [ ] Three frontend builds deployed per subdomain with `EXPO_PUBLIC_PORTAL` + `EXPO_PUBLIC_API_BASE_URL`.
- [ ] No secrets in git or the frontend bundle; CI quality gates pass (`.github/workflows/ci.yml`) or run `./scripts/verify-production.sh` locally.
- [ ] OTP login works on each portal; non-admin token → 403 on `/admin/*` (RBAC verified).
- [ ] At least one WooCommerce store connected (REST or plugin) and showing real data.

---

## Part B — Production backend (`services/api`)

> **This is the only backend you deploy.** Express + Postgres + JWT/OTP + RBAC + credential vault +
> WooCommerce REST proxy (with SSRF protection) + plugin signed sync + webhooks + billing.

### B1. Install, migrate, run

```bash
cd services/api
cp .env.example .env          # set secrets (see B2)
npm install
npm run db:up                 # optional local Postgres via docker compose
npm run migrate               # apply schema (add --seed only in dev)
npm run dev                   # http://localhost:8080
```

Production: `npm run build && npm start` behind Nginx (see `services/api/deploy/` and
`SERVER_SETUP.fa.md`).

### B2. Required environment variables

See `services/api/.env.example` and `services/api/README.md`. Production **must** set:

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Access token signing (≥16 chars) |
| `OTP_HASH_SECRET` | OTP hashing (≥16 chars) |
| `CREDENTIAL_ENCRYPTION_KEY` | AES-256-GCM vault key (32 bytes hex/base64) — **required in production** |
| `CORS_ORIGINS` | Comma-separated portal origins — **required in production** (empty → process exit) |
| `ADMIN_MOBILE_ALLOWLIST` | Mobiles allowed into admin portal |
| `IPPANEL_PROVIDER=edge` + `IPPANEL_BASE_URL=https://edge.ippanel.com/v1` | ippanel Edge API (recommended) |
| `TRUST_PROXY=true` | Honor `X-Forwarded-Proto` behind Nginx Proxy Manager |

Optional but recommended: `PUBLIC_API_BASE_URL`, portal URLs, `BILLING_PROVIDER`, payment webhook
secret, ippanel pattern/originator.

### B3. Security built-in

- **SSRF guard** on merchant store URLs before any WooCommerce fetch (`src/util/ssrf.ts`): blocks
  localhost, private/link-local/metadata IPs, non-http(s), embedded credentials, and unsafe redirects.
- **Full paginated sync** on connect/resync — walks every WooCommerce list page (100/page), not only
  the first 100 records.
- Encrypted credential vault, tenant/site isolation, audit log, plugin HMAC + replay guard, webhook
  idempotency.

### B4. Runtime frontend config (build once, deploy everywhere)

Each portal static export serves `/config.json` (copied from `apps/client/public/config.*.json`).
Swap this file on the server to point at your API **without rebuilding**:

```json
{ "apiBaseUrl": "https://api.jet-web.ir", "portal": "merchant" }
```

Templates: `config.local-preview.json` (HTTP internal IP), `config.production.json` (HTTPS subdomains).

**Build defaults (important for cloud hosts like Vercel):** the build only bakes a preset
`config.json` when you opt in with `RUNTIME_CONFIG_ENV=local-preview|production` (used by
`install_portal.sh`). A plain `expo export -p web && node scripts/pwa-postbuild.mjs` build
instead writes `config.json` from `EXPO_PUBLIC_API_BASE_URL`; when that env var is empty the app
runs on self-contained **mock data** so the public preview (login + dashboard) works with no
backend. Set `EXPO_PUBLIC_API_BASE_URL` (or swap `config.json` at runtime) to point at a
**publicly reachable** API — the self-hosted `api.jet-web.ir` / internal IP is not reachable from
a cloud host.

### B5. Automated install (Ubuntu 24.04)

```bash
sudo ./scripts/install_portal.sh --mode local-preview --domain jet-web.ir --server-ip 192.168.101.181
sudo ./scripts/install_portal.sh --mode production-behind-npm --domain jet-web.ir --dry-run-sms false
./scripts/verify-live.sh --base-url http://192.168.101.181 --api-url http://192.168.101.181
```

Nginx examples: `services/api/deploy/nginx/jet-web.local-preview.conf`, `jet-web.production.conf`.

Backend smoke test (same entry as systemd): `cd services/api && npm run smoke:start`.

### B5a. Own-server build (manual, outside Vercel)

The same Expo static export runs on a normal Ubuntu/Nginx box — no Vercel, no Windows hosts file.
Build each portal as a **production runtime** so it never silently uses mock data:

```bash
cd apps/client && npm ci
EXPO_PUBLIC_RUNTIME_ENV=production npm run export:web:merchant     # -> dist-merchant/
EXPO_PUBLIC_RUNTIME_ENV=production npm run export:web:admin        # -> dist-admin/
EXPO_PUBLIC_RUNTIME_ENV=production npm run export:web:affiliate    # -> dist-affiliate/

# Deploy the per-portal runtime config (real API base URL, correct portal):
cp config/merchant.production.json   dist-merchant/config.json
cp config/admin.production.json      dist-admin/config.json
cp config/affiliate.production.json  dist-affiliate/config.json
```

Verify each export carries the right portal before serving:

```bash
for p in merchant admin affiliate; do
  node -e "const c=require('./apps/client/dist-'+'$p'+'/config.json'); console.log('$p ->', c.portal, c.apiBaseUrl)"
done
# expect: merchant -> merchant https://api.jet-web.ir   (and admin/affiliate respectively)
```

Map each hostname to its dist directory in Nginx (server-side host isolation — never rely on a
client hosts file):

| Hostname | Nginx root |
| :--- | :--- |
| `app.jet-web.ir` | `…/apps/client/dist-merchant` |
| `admin.jet-web.ir` | `…/apps/client/dist-admin` |
| `partner.jet-web.ir` | `…/apps/client/dist-affiliate` |
| `api.jet-web.ir` | reverse-proxy → backend (`services/api`, port 8080) |

**Production runtime safety:** production builds (`EXPO_PUBLIC_RUNTIME_ENV=production`, set by the
per-portal Vercel configs and `install_portal.sh`) refuse to run on mock data. If `config.json` is
missing, has an invalid/empty `apiBaseUrl`, or declares a portal that mismatches the build, the app
shows a **visible Persian error screen** (never a blank page and never a silent mock fallback). The
default Vercel preview build (no `EXPO_PUBLIC_RUNTIME_ENV`) keeps the mock demo behavior.

### B6. CI / verification

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR:

- **Backend:** `npm ci` → typecheck → test → build → migrate (Postgres service)
- **Frontend:** `npm ci` → typecheck → lint → test → `export:web:all`

Locally, reproduce with:

```bash
./scripts/verify-production.sh 2>&1 | tee docs/VERIFY.log
```

---

## Part C — Database (`services/api/db`)

`services/api/db/migrations/` holds ordered, tracked Postgres migrations. Apply with `npm run migrate`
(idempotent). Rollback guidance: `services/api/db/migrations/ROLLBACK.md`.

- Money stored as integer minor units; **no card data and no raw secrets**.
- Seed data (`npm run migrate -- --seed`) is blocked in production.

---

## Part D — Payments (platform subscription billing)

Implemented in `services/api` via `src/services/billing/` and `BILLING_PROVIDER` (`manual` / `mock` /
`zarinpal`). Merchant store checkout stays on WooCommerce; this bills tenants for platform plans only.

---

## Part E — WordPress companion plugin (`wordpress-plugin`)

1. Package `wordpress-plugin/` and install/activate on the merchant's WordPress site (requires WooCommerce).
2. In plugin admin, paste backend URL (`https://api.example.com/plugin`), site id, tenant id, and the
   one-time signing secret from Connect Site (plugin mode).
3. The plugin signs sync packages/events (HMAC-SHA256); **`services/api`** verifies signature + replay
   guard before persisting read models. WP-cron syncs hourly; **Sync now** triggers on demand.

---

## Part F — Go‑live runbook (ordered)

1. **Database** — provision Postgres, run `npm run migrate` (no `--seed` in production).
2. **Secrets** — set all production env vars (Part B2); confirm `CORS_ORIGINS` and vault key.
3. **Backend** — deploy `services/api` on `api.example.com` behind HTTPS.
4. **Frontends** — build three portals (`export:web:merchant|admin|affiliate`) and deploy per subdomain.
5. **Payments** — configure `BILLING_PROVIDER` + webhook secret; test in sandbox first.
6. **WordPress** — install companion plugin, handshake, confirm signed sync.
7. **Verify** — OTP on each portal, RBAC 403 checks, connect a real store, run CI or `verify-production.sh`.
8. **Security review** — complete Part G checklist.

---

## Part G — Security checklist (must pass before go‑live)

- [ ] No secrets in git (code, config, fixtures, `.env`) — anywhere.
- [ ] No secrets in the frontend bundle; the frontend talks only to **`services/api`**.
- [ ] Store credentials & payment keys encrypted in the vault; never returned to clients.
- [ ] Per‑site / per‑tenant isolation enforced server-side (`assertTenantAccess` / `assertSiteAccess`).
- [ ] Merchant store URLs SSRF-checked before outbound WooCommerce fetches.
- [ ] `CORS_ORIGINS` set in production (server exits if empty).
- [ ] Disconnect revokes credentials server-side.
- [ ] All privileged actions audited with secrets/PII redacted.
- [ ] All traffic over HTTPS; webhooks signature‑verified and idempotent.
- [ ] RBAC enforced server‑side on every privileged route.

---

## Appendix R — `apps/api` (reference only — do not deploy)

`apps/api/` contains **TypeScript design contracts** from early architecture work: route interfaces,
adapter stubs, database descriptors, and security helpers. It has **no HTTP server, no DB client, and
no runnable entrypoint**.

Use it as documentation when extending `services/api`. All production endpoints, migrations, and
deployment configs live under **`services/api/`** only.

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
