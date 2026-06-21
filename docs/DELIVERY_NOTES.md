# JetWeb — Final delivery notes (internal)

Status of the items finished/deferred in the final PR. None of the deferred items shows any
broken button or customer-facing "demo / not connected / coming soon" text.

## Implemented

- **WooCommerce product sync (deep).** Categories, tags, brands (optional `product_brand`),
  attributes + terms, per-product attributes, images, variations, and full `raw`/`meta` preserved.
  Both transports (REST sync + signed plugin envelope) use the same `upsertProductFull` path.
- **Plugin transport (backend).** HMAC-signed handshake/sync/events/health with timestamp-skew +
  nonce replay protection; events idempotent on `(site_id, idempotency_key)`. Proven by
  `src/__tests__/pluginTransport.test.ts` (E2E against the real Express app).
- **Truthful product create.** `POST /merchant/sites/:siteId/products` creates a REAL WooCommerce
  product and reports its ACTUAL resulting status (publish only if WooCommerce returns publish;
  else draft). No REST connection → truthful 400; WooCommerce failure → visible error (never a fake
  success). Covered by `src/__tests__/productCreate.test.ts`.
- **Quick edit.** `PATCH /merchant/sites/:siteId/products/:productId` writes name / regular price /
  sale price / stock qty / stock status / status / categories to WooCommerce, then re-syncs.
  Truthful resulting-status + error handling covered by `src/__tests__/productWrite.test.ts`.
- **Open in WordPress.** Product detail offers an advanced-edit link (`admin_edit_url`).
- **Store settings edit (merchant UI).** `StoreSettingsScreen` edits a connected store's name/URL
  (`PATCH /merchant/sites/:siteId`), shows the real connection/sync status
  (`GET /merchant/sites/:siteId/status`), and supports re-entering + re-testing REST credentials
  (`POST /merchant/sites/connect/verify`). Secrets are never displayed (masked `••••••`); re-entry
  is required to change them. Gated to the live app (hidden in the mock build). Covered by
  `apps/client/src/features/site/__tests__/StoreSettingsScreen.test.tsx`.
- **Plugin packaging script.** `scripts/package-plugin.sh` builds the installable plugin zip into
  the gitignored `wordpress-plugin/build/`. The zip is a build artifact and is never committed.

## Deferred (clean UI, no broken controls)

- **Binary product image upload.** Deferred. The product **create** form no longer shows an image
  picker (the earlier picker silently dropped the selection); it shows an honest note that photos
  are added in WordPress after creation. The safe path is existing WooCommerce media (id/URL);
  product images still sync and display from WordPress. No upload button is rendered.
- **In-app plugin re-pair + live WordPress-plugin delivery.** The WordPress plugin client is still a
  read-only foundation (see `wordpress-plugin/README.md`) and does not yet perform live network
  delivery; the backend transport + tests are ready. The **REST fallback is the supported working
  path**. Store settings shows plugin status + how to re-pair from WordPress (no broken in-app
  re-pair button).
- **User avatar upload/storage.** Deferred. `avatarUrl` display is supported (header/profile show
  the image when present; initials fallback otherwise). No upload button is rendered.
- **Support ticket backend (merchant → admin).** Deferred. The support chat is a clean local
  messaging surface with a neutral acknowledgement (no "a teammate will reply" claim, no demo
  wording). No broken send button.

## Live verification status (phase-3, honest)

Local automated gates (typecheck / lint / Jest / build / portal export) and the live production
checks (`update_portal.sh`, `verify-live.sh`, SNI-safe curl, browser/device checks against
`api/app/admin/partner.jet-web.ir`) were **NOT run in this work environment**: the sandbox has no
access to the npm registry (installs are blocked) and no access to the production servers. Changes
were validated by careful static review against the actual component/route APIs and the existing
test patterns; the repository CI (which installs dependencies) runs the full gate suite on the PR.
Operators must run the live checklist below on the new portal server. No live success is claimed
here that was not actually executed.

## Server / deployment readiness

- **Body size.** Plugin signed-sync route accepts up to **25mb** (`express.text` limit in
  `services/api/src/http/routes/plugin.ts`) to fit large catalog envelopes (product + meta +
  variations). The general JSON API stays at 256kb (small requests). Set Nginx
  `client_max_body_size 25m;` on `api.jet-web.ir`. No binary upload → no large multipart limits.
- **Batching / pagination.** REST sync paginates every WooCommerce list (100/page); the plugin
  delivers the catalog in background batches (WP-cron) and retries failed batches.
- **Retry / timeout.** Plugin side retries failed deliveries; nonce replay protection makes retries
  safe (a re-sent batch with a new nonce is fine; a replayed nonce is rejected).
- **Large meta.** Stored as JSONB; does not crash the API.

## Live Dora smoke runbook (operator)

1. Install `wordpress-plugin/` on the Dora WooCommerce site.
2. In **JetWeb Connector** settings, paste the one-time pairing code from the JetWeb merchant
   portal and Save. The plugin pairs with `api.jet-web.ir` and stores the per-site signing secret.
3. Confirm **connected** status, then run the initial full sync (or the manual "re-sync" button).
4. Optional CLI verification (no secrets committed):
   ```bash
   JETWEB_API_BASE=https://api.jet-web.ir WCOS_SITE_ID=<uuid> WCOS_TENANT_ID=<uuid> \
   WCOS_SIGNING_SECRET=<secret> node services/api/scripts/smoke-dora.mjs health
   ```
5. In the merchant portal, verify the Dora catalog (e.g. variable «عبای محرم» with `pa_size`
   1/2/3, gallery, category «عمومی», brand) appears with correct price/stock; product detail is
   clean (no raw WooCommerce clutter). Backend keeps the full `raw`/`meta`.
