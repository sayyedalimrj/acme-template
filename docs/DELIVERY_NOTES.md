# JetWeb — Final delivery notes (internal)

Status of the items finished/deferred in the final PR. None of the deferred items shows any
broken button or customer-facing "demo / not connected / coming soon" text.

## Implemented

- **WooCommerce product sync (deep).** Categories, tags, brands (optional `product_brand`),
  attributes + terms, per-product attributes, images, variations, and full `raw`/`meta` preserved.
  Both transports (REST sync + signed plugin envelope) use the same `upsertProductFull` path.
- **Plugin transport.** HMAC-signed handshake/sync/events/health with timestamp-skew + nonce
  replay protection; events idempotent on `(site_id, idempotency_key)`. Proven by
  `src/__tests__/pluginTransport.test.ts` (E2E against the real Express app).
- **Quick edit.** `PATCH /merchant/sites/:siteId/products/:productId` writes name / regular price /
  sale price / stock qty / stock status / status / categories to WooCommerce, then re-syncs.
- **Open in WordPress.** Product detail offers an advanced-edit link (`admin_edit_url`).

## Deferred (clean UI, no broken controls)

- **Binary product image upload.** Deferred. Advanced image management is handled in WordPress for
  this delivery. The safe path is existing WooCommerce media (id/URL); product images still sync
  and display from WordPress. No upload button is rendered.
- **User avatar upload/storage.** Deferred. `avatarUrl` display is supported (header/profile show
  the image when present; initials fallback otherwise). No upload button is rendered.
- **Support ticket backend (merchant → admin).** Deferred. The support chat is a clean local
  messaging surface with a neutral acknowledgement (no "a teammate will reply" claim, no demo
  wording). No broken send button.

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
