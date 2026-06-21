# Portal operations runbook (new portal server)

This is the day-2 runbook for the self-hosted JetWeb setup. It covers the **one documented
normal-update command**, first install, rollback, Cloudflare/NPM origin SSL, and verification.

```
Cloudflare (orange-cloud) → OLD Ubuntu (Nginx Proxy Manager) → NEW Ubuntu (this portal server)
```

The **new portal server** hosts: backend API (Node + systemd `portal-api`), PostgreSQL, internal
Nginx, and the three frontend dists: `dist-merchant`, `dist-admin`, `dist-affiliate`.

---

## Golden rule: normal updates touch ONLY the new portal server

Run **all normal code updates on the new portal server** with one command:

```bash
sudo /var/www/portal/scripts/update_portal.sh
```

That script: backs up `.env` + a Postgres dump + the current dists → `git pull --ff-only` →
`npm ci` → migrations → backend build → **clean, isolated per-portal frontend builds** → restart
`portal-api` → `nginx -t` → reload **internal** Nginx → verify → print rollback steps. It never
runs `--force-env`, never regenerates/prints secrets, never overwrites `.env`, and **never touches
the old NPM/Cloudflare server**.

### Do NOT touch the old NPM server during updates

Only touch the old Nginx-Proxy-Manager / Cloudflare box when one of these actually changes:

- a **domain**, a **target IP**, an **SSL/origin certificate**, an **NPM proxy host**, or an
  **internal port**.

A normal GitHub update changes none of those, so the old server stays untouched.

---

## First install (new portal server only)

```bash
sudo /var/www/portal/scripts/install_portal.sh --mode production-behind-npm --domain jet-web.ir
```

What the hardened installer guarantees:

- Creates/verifies the **`deploy`** service user **before** writing the systemd unit (prevents the
  `status=217/USER` boot failure) and chowns the app tree to it.
- **Never overwrites an existing `.env`** unless you pass `--force-env` (which prints a loud
  warning). Even with `--force-env` it **preserves** existing secrets: `JWT_SECRET`,
  `OTP_HASH_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, the **DB password** (no drift — it reuses the
  existing `DATABASE_URL` / `ALTER USER`s to match), the **IPPanel API key + `IPPANEL_PATTERN_CODE`**,
  originator, OTP variable, `SMS_DRY_RUN`, and `ADMIN_MOBILE_ALLOWLIST`. On a **fresh** install the
  default `IPPANEL_PATTERN_CODE` is `ebvqrqy10gm3o04` (the current production pattern); updates to an
  already-installed box keep whatever pattern that server's `.env` already has.
- **Preflights the API port** (default 8080). If it's taken (e.g. the old Nginx preview), it fails
  with an actionable message instead of silently killing another service.
- Builds each portal with the clean, cache-isolated export (see below).

`--resume` skips already-completed steps. `SERVICE_USER=…` / `API_PORT=…` override defaults.

---

## Admin access (server-side)

Admin access is enforced **server-side** via the admin allow-list + role mechanism — never in the
frontend. `09186441801` is a built-in platform-admin number (merged with `ADMIN_MOBILE_ALLOWLIST`),
and an allow-listed mobile that signs in through `https://admin.jet-web.ir/` is reconciled to
`platform_admin` even if it previously signed up as a merchant. Non-admin portals are unaffected.

---

## Clean portal builds (no bundle/portal mismatch)

Each portal is built with an isolated bundler cache, an explicit portal env, and a unique
`BUILD_ID`, so admin/partner can never inherit the merchant bundle:

```bash
cd /var/www/portal/apps/client
npm run export:web:all:production:clean
```

Verify the result:

```bash
cat dist-merchant/config.json   # portal=merchant, apiBaseUrl=https://api.jet-web.ir
cat dist-admin/config.json      # portal=admin
cat dist-affiliate/config.json  # portal=affiliate
/var/www/portal/scripts/verify_portal_builds.sh
```

`verify_portal_builds.sh` checks each `config.json` portal + API URL **and** that the three JS
bundles are distinct (identical bundles ⇒ a reused cached build).

---

## Verification

```bash
# On the server (systemd, API health, nginx, portal configs):
/var/www/portal/scripts/verify-live.sh \
  --merchant-url https://app.jet-web.ir --admin-url https://admin.jet-web.ir \
  --affiliate-url https://partner.jet-web.ir --api-url https://api.jet-web.ir

# SNI-safe LOCAL origin checks (see note below):
SNI_LOCAL=true /var/www/portal/scripts/verify-live.sh --api-url https://api.jet-web.ir
```

### Why `--resolve` (SNI), not `-H "Host:"`, for local HTTPS

TLS **SNI** sends the hostname **inside the TLS handshake — before** any HTTP `Host:` header. So
`curl -H "Host: api.jet-web.ir" https://127.0.0.1` can make the server pick the wrong cert/vhost.
Use `--resolve` so curl does SNI for the real hostname but connects to localhost:

```bash
curl -k -I --resolve api.jet-web.ir:443:127.0.0.1     https://api.jet-web.ir/health
curl -k -I --resolve app.jet-web.ir:443:127.0.0.1     https://app.jet-web.ir/
curl -k -I --resolve admin.jet-web.ir:443:127.0.0.1   https://admin.jet-web.ir/
curl -k -I --resolve partner.jet-web.ir:443:127.0.0.1 https://partner.jet-web.ir/
```

---

## Rollback

`update_portal.sh` prints exact rollback steps and a backup dir (`/var/backups/portal/<ts>/`):

```bash
cd /var/www/portal
git reset --hard <PREV_SHA>                     # printed by the update script
( cd services/api && npm ci && npm run build )
for p in merchant admin affiliate; do
  rm -rf apps/client/dist-$p && cp -a /var/backups/portal/<ts>/dist-$p.bak apps/client/dist-$p
done
systemctl restart portal-api && nginx -t && systemctl reload nginx
# DB restore (DESTRUCTIVE, only if a migration broke data):
#   psql "$DATABASE_URL" < /var/backups/portal/<ts>/portal-db.sql
```

---

## Cloudflare / NPM origin SSL (only when SSL/domain/IP/proxy/port changes)

- Cloudflare SSL mode: **Full (strict)** with a **Cloudflare Origin Certificate** installed on the
  edge that terminates TLS (the NPM box). A self-signed origin without Full-strict alignment causes
  the **525** handshake error.
- The NPM proxy host forwards to the **new portal server's internal IP + port**. If the origin cert
  or that target changes, update NPM; otherwise leave it alone.
- The internal Nginx on the new server serves the three SPAs + proxies `/` of `api.*` to
  `127.0.0.1:8080`. `client_max_body_size` must be large enough for full-sync payloads (the plugin
  posts batched JSON); raise it on the API server block if large stores 413.

---

## Browser cache / service worker after a deploy

Each deploy ships a byte-changed `index.html` + `sw.js` (unique `BUILD_ID`) so browsers pick up the
new worker. If a user is stuck on an old shell: hard refresh (or the built-in recovery screen's
"reload" button clears caches + unregisters the SW and reloads). The blank-page watchdog remains
intact.

---

## Connecting a store: plugin pairing (recommended) + REST fallback

- **Plugin-first (recommended):** install the JetWeb Connector plugin, paste the pairing
  tenant/site IDs + one-time signing secret shown once in the merchant UI; the plugin handshakes to
  `https://api.jet-web.ir/plugin` and pushes **HMAC-signed** sync/event payloads.
- **REST fallback (advanced):** the merchant enters store URL + WooCommerce consumer key/secret;
  the backend verifies + seals them in the credential vault and pulls a normalized read-model.
- **Secrets never reach the frontend.** Stored secrets are shown as `••••••`; changing them
  requires re-entry, after which the connection is re-tested.

## Store settings: editing a connected store (merchant UI)

Reachable from **Connect store → a connected store → “Store settings”** (the button only shows in
the live app where the backend is configured; it is hidden in the public mock/demo build so there
is no dead control). The screen (`apps/client/src/features/site/StoreSettingsScreen.tsx`) lets a
merchant:

- See the **real** connection state: status, connection type (REST vs plugin), last sync time, and
  the last sync error (from `GET /merchant/sites/:siteId/status`). A **Refresh** button re-reads it.
- Edit the **display name** and **store URL** (`PATCH /merchant/sites/:siteId`). The backend
  re-validates the URL (SSRF-guarded) and, **if the host actually changes, sets the site back to
  `pending`** so the connection must be re-verified. The UI surfaces that requirement.
- **Advanced — REST credentials:** the stored key/secret is shown only as a masked `••••••`
  placeholder (never the real value). To change them, the merchant re-enters the key + secret and
  presses **Re-test connection** (`POST /merchant/sites/connect/verify`), which re-verifies and
  re-seals the credentials server-side.
- **Plugin connection:** when the store is paired via the plugin, the screen shows plugin status,
  version, and last-seen, plus a note on how to re-pair from the WordPress connector (an in-app
  re-pair button is intentionally **not** shown — see “Known gaps”).

## Products: truthful create / edit

- **Create** (`POST /merchant/sites/:siteId/products`) writes a **real** WooCommerce product when a
  REST connection exists and reports the **actual** resulting status returned by WooCommerce
  (published only if WooCommerce returns `publish`; otherwise “saved as draft”). If the store has no
  REST connection the merchant gets a truthful error (no fake “submitted for review”). WooCommerce
  failures surface as a visible error — never a silent fake success.
- **Edit** (`PATCH /merchant/sites/:siteId/products/:productId`) writes name / regular + sale price
  / stock / status / categories to WooCommerce and re-syncs the read-model so the UI reflects the
  real resulting state.
- **Product photos** are added in WordPress after creation (there is no binary media-upload
  endpoint). The create form shows an honest note to that effect instead of an image picker that
  would silently drop the selection. Photos added in WordPress sync back and display in-app.

## WordPress plugin packaging (build artifact — never committed)

Build the installable plugin zip with:

```bash
./scripts/package-plugin.sh
# → wordpress-plugin/build/wordpress-commerce-os-companion-<version>.zip
```

The output directory `wordpress-plugin/build/` and all `*.zip` files are **gitignored**: the zip is
a build artifact and must never be committed. Only the plugin source is tracked.

### Known gaps (honest)

- The **backend** plugin transport (handshake / signed sync / signed events / health, with HMAC +
  nonce-replay + idempotency) is implemented and covered by tests. The **WordPress plugin client**
  is still a read-only foundation (per `wordpress-plugin/README.md`) and does not yet perform live
  network delivery, so end-to-end plugin pairing has **not** been live-verified. The **REST
  fallback is the supported, working path** today. Re-pairing is operator-driven from WordPress.

## Migrations

Run on the new portal server only (the update script does this automatically):

```bash
cd /var/www/portal/services/api && npm run migrate
```
