# services/api — Backend (auth/OTP via ippanel, RBAC, Postgres)

A small, runnable Express + TypeScript API that powers the three portals' login and data:

- **Phone OTP login** via **ippanel** (pattern SMS), with hashed codes, expiry, attempt limits,
  and per-mobile rate limiting.
- **JWT** sessions + **RBAC** (merchant / admin / affiliate; admin is a superuser).
- **Postgres** schema for users, marketers, merchants, referrals, commissions, payouts, and
  platform orders.

> Security: no secrets in git. Real values (DB URL, JWT secret, ippanel key) come from `.env`
> (local) or your secret manager (production). Raw OTP codes are never stored — only a salted
> hash. No card/PAN data is stored anywhere.

## Quick start (local)

```bash
cd services/api
cp .env.example .env          # then fill JWT_SECRET and OTP_HASH_SECRET (openssl rand -hex 32)
npm install
npm run db:up                 # starts Postgres via docker compose
npm run migrate -- --seed     # creates the schema + demo data  (or: npm run seed)
npm run dev                   # starts the API on http://localhost:8080
```

With `SMS_DRY_RUN=true` (the default), no SMS is sent: the OTP code is printed to the server log
and returned as `devCode` in the response (non-production only) so you can test the full flow
before configuring ippanel.

## Enable real OTP SMS (ippanel)

1. In your ippanel panel, register a sender line and create an **approved OTP pattern** with a
   variable (e.g. `code`).
2. Set in `.env`:
   ```
   SMS_DRY_RUN=false
   IPPANEL_API_KEY=...            # from ippanel (server-only secret)
   IPPANEL_PATTERN_CODE=...       # your approved pattern code
   IPPANEL_ORIGINATOR=...         # your sender line
   IPPANEL_OTP_VARIABLE=code      # the variable name used in your pattern
   IPPANEL_AUTH_SCHEME=accesskey  # or "apikey" depending on your ippanel account
   ```
3. Restart the API. Now `POST /auth/otp/request` sends a real SMS.

## Access control

- **Admin:** only mobiles in `ADMIN_MOBILE_ALLOWLIST` may sign into the admin portal.
- **Affiliate:** self-serve signup is allowed when `AFFILIATE_OPEN_SIGNUP=true`; a marketer
  profile + referral code is created on first login.
- **Merchant:** open signup.

## Endpoints

| Method | Path                  | Auth            | Purpose                                   |
| ------ | --------------------- | --------------- | ----------------------------------------- |
| GET    | `/health`             | —               | Liveness                                  |
| POST   | `/auth/otp/request`   | —               | `{ mobile, portal }` → send OTP           |
| POST   | `/auth/otp/verify`    | —               | `{ mobile, code, portal, name? }` → token |
| GET    | `/auth/me`            | Bearer          | Current user                              |
| GET    | `/admin/overview`     | admin           | Platform KPIs                             |
| GET    | `/admin/merchants`    | admin           | Merchants list                            |
| GET    | `/admin/orders`       | admin           | Platform-wide orders                      |
| GET    | `/admin/marketers`    | admin           | Marketer network                          |
| GET    | `/affiliate/overview` | affiliate       | The marketer's earnings summary           |
| GET    | `/affiliate/referrals`| affiliate       | The marketer's referred merchants         |
| GET    | `/affiliate/commissions` | affiliate    | The marketer's commission ledger          |
| GET    | `/merchant/overview`  | merchant        | The store owner's overview                |

### Example

```bash
# request a code (dry-run prints it in the response/log)
curl -s localhost:8080/auth/otp/request -H 'content-type: application/json' \
  -d '{"mobile":"09120000000","portal":"admin"}'

# verify and get a token (use the demo admin mobile + ADMIN_MOBILE_ALLOWLIST=09120000000)
curl -s localhost:8080/auth/otp/verify -H 'content-type: application/json' \
  -d '{"mobile":"09120000000","code":"<devCode>","portal":"admin"}'
```

## Production

- Provide a managed Postgres `DATABASE_URL` (TLS is enabled automatically when `NODE_ENV=production`).
- Set strong `JWT_SECRET` and `OTP_HASH_SECRET`, the ippanel keys, `ADMIN_MOBILE_ALLOWLIST`, and
  `CORS_ORIGINS` (your three subdomains) in your secret manager.
- `npm run build && npm start` (or run the provided container/host of your choice).
- Run `npm run migrate` once on deploy to apply the schema.

See the repo-root `DEPLOYMENT.md` for the full multi-subdomain runbook and
`SERVER_SETUP.fa.md` for Ubuntu + Nginx + SSL step-by-step (Persian).

Example production configs: `services/api/deploy/` (`portal-api.service`, `nginx/*.example`).
