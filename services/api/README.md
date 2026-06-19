# services/api — Production backend (auth, RBAC, WooCommerce, plugin sync, billing)

A runnable Express + TypeScript API that powers all three portals (merchant / admin / affiliate)
from one shared backend, with server-side RBAC + tenant/site isolation.

- **Phone OTP login** via **ippanel** (hashed codes, expiry, attempt + rate limits) → **JWT
  access token + rotating refresh token** (logout/revocation supported).
- **Granular RBAC**: platform_admin, support_admin, merchant_owner/manager/staff/viewer,
  affiliate, system. Enforced per-route + per-tenant/site — never frontend-only.
- **WooCommerce REST proxy**: connect a store with consumer key/secret (verified + sealed in the
  **AES-256-GCM credential vault**); read products/orders/customers/coupons/reports; controlled
  writes (stock, order status). The frontend never sees store keys.
- **WordPress companion plugin transport**: signed (HMAC-SHA256) handshake/sync/events/health with
  timestamp-skew + nonce replay protection.
- **Webhooks**: WooCommerce + payment, signature-verified, idempotent, deduped.
- **Affiliate**: referrals, commission ledger (idempotent generation), payout requests + admin
  approval lifecycle.
- **Billing**: plans, subscriptions, checkout→verify, idempotent billing events. Providers:
  manual / mock / zarinpal.
- **Audit log** for every privileged action, with secret/PII redaction.

> Security: no secrets in git. Real values (DB URL, JWT/OTP/vault secrets, ippanel, gateway keys)
> come from `.env` (local) or your secret manager (production). Raw OTP codes and WooCommerce/
> plugin secrets are never stored in plaintext or returned to clients.

## Quick start (local)

```bash
cd services/api
cp .env.example .env          # set JWT_SECRET, OTP_HASH_SECRET, CREDENTIAL_ENCRYPTION_KEY
npm install
npm run db:up                 # Postgres via docker compose (or use a managed DB + DATABASE_URL)
npm run migrate -- --seed     # ordered, tracked migrations + dev seed (seed is blocked in prod)
npm run dev                   # http://localhost:8080
```

`SMS_DRY_RUN=true` prints the OTP to the log and returns it as `devCode` (non-production only).

## Migrations

Ordered SQL files in `db/migrations/NNN_*.sql`, applied once each and tracked in
`schema_migrations`. `npm run migrate` is idempotent. Rollback guidance: `db/migrations/ROLLBACK.md`.

## Endpoints (summary)

| Area | Routes |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Merchant — sites | `GET /merchant/sites`, `POST /merchant/sites/connect/start`, `POST /merchant/sites/connect/verify`, `GET /merchant/sites/:id/status`, `POST /merchant/sites/:id/disconnect`, `POST /merchant/sites/:id/sync`, `POST /merchant/sites/:id/webhook-secret` |
| Merchant — data | `GET /merchant/overview`, `GET /merchant/sites/:id/overview`, `.../products`, `.../products/:pid`, `.../orders`, `.../orders/:oid`, `.../customers`, `.../coupons`, `.../reports/sales`; `PATCH .../products/:pid/stock`, `PATCH .../orders/:oid/status` |
| Plugin (signed) | `POST /plugin/handshake`, `POST /plugin/sync`, `POST /plugin/events`, `POST /plugin/health` |
| Webhooks | `POST /webhooks/woocommerce/:siteId`, `POST /webhooks/payment/:provider` |
| Admin | `GET /admin/overview`, `/admin/merchants`, `/admin/merchants/:id`, `PATCH /admin/merchants/:id/status`, `/admin/sites`, `/admin/sites/:id/sync-runs`, `POST /admin/sites/:id/resync`, `/admin/orders`, `/admin/marketers`, `/admin/payouts`, `PATCH /admin/payouts/:id`, `/admin/audit`, `/admin/events`, `/admin/plans`, `/admin/subscriptions` |
| Affiliate | `GET /affiliate/overview`, `/affiliate/referrals`, `/affiliate/commissions`, `/affiliate/payouts`, `POST /affiliate/payouts`, `/affiliate/profile` |
| Billing | `GET /billing/plans`, `GET /billing/subscription`, `POST /billing/checkout`, `POST /billing/verify` |

## Connecting a WooCommerce store (REST mode)

1. `POST /merchant/sites/connect/start { name, url, mode: "woo_rest" }` → `{ siteId }`.
2. In WooCommerce: WooCommerce → Settings → Advanced → REST API → create a **Read/Write** key.
3. `POST /merchant/sites/connect/verify { siteId, consumerKey, consumerSecret }`. The backend
   verifies the keys against the store, seals them in the vault, and runs an initial sync.
4. (Optional realtime) `POST /merchant/sites/:id/webhook-secret` → returns a secret + delivery URL;
   add a WooCommerce webhook (Settings → Advanced → Webhooks) pointing at that URL with that secret.

## Connecting via the WordPress plugin (signed sync mode)

1. `POST /merchant/sites/connect/start { name, url, mode: "plugin" }` → `{ siteId, tenantId,
   signingSecret, deliveryBaseUrl }` (the signing secret is shown **once**).
2. Install the companion plugin (`wordpress-plugin/`), open its settings, and paste the API base
   URL, site id, tenant id, and signing secret.
3. The plugin handshakes + pushes signed sync/events on a schedule (and via "Sync now"). The
   backend verifies HMAC + timestamp + nonce before persisting.

## Production

- Provide a managed Postgres `DATABASE_URL` (TLS is enabled automatically when `NODE_ENV=production`).
- Set strong `JWT_SECRET`, `OTP_HASH_SECRET`, `CREDENTIAL_ENCRYPTION_KEY` (32-byte), ippanel keys,
  `ADMIN_MOBILE_ALLOWLIST`, `CORS_ORIGINS` (your three subdomains), and billing provider keys.
- `npm run build && npm start`. Run `npm run migrate` once on deploy.

See the repo-root `DEPLOYMENT.md` for the full multi-subdomain runbook and
`SERVER_SETUP.fa.md` for Ubuntu + Nginx + SSL step-by-step (Persian).

Example production configs: `services/api/deploy/` (`portal-api.service`, `nginx/*.example`).
