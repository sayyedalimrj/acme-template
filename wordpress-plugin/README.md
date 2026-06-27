# WordPress Commerce OS Companion

Production companion plugin for **JetWeb Commerce OS**. Connects a WordPress + WooCommerce store to `https://api.jet-web.ir` using HMAC-SHA256 signed server-to-server transport (no WooCommerce REST keys required).

## Production connection flow

1. Merchant portal (`https://app.jet-web.ir`) → **Connect site** → choose **WordPress plugin**.
2. Copy one-time values: `deliveryBaseUrl`, `siteId`, `tenantId`, `signingSecret`.
3. Install this plugin on the WooCommerce site → **WordPress Commerce OS** admin page.
4. Paste settings → **Test connection** → **Connect (Handshake)** → **Full sync**.
5. Dashboard shows synced products/orders/customers/coupons and connection health.

## Plugin settings

| Field | Example |
| --- | --- |
| Backend URL | `https://api.jet-web.ir` or `https://api.jet-web.ir/plugin` (normalized automatically) |
| Site ID | From merchant portal |
| Tenant ID | From merchant portal |
| Signing secret | Shown once at connect start or after secret rotation |

## Signed transport

All requests POST to `{backendUrl}/handshake`, `/sync`, `/events`, `/health`.

```
base = siteId \n tenantId \n timestamp \n nonce \n pluginVersion \n sha256_hex(raw_json_body)
signature = HMAC-SHA256(base, signingSecret) → hex
```

Headers: `x-wcos-site-id`, `x-wcos-tenant-id`, `x-wcos-timestamp`, `x-wcos-nonce`, `x-wcos-plugin-version`, `x-wcos-signature`.

## Sync

- Schema `wcos.sync.v2` — chunked by entity (categories, products, orders, customers, coupons).
- Default batch size: 25 (configurable via `wcos_sync_batch_size` option).
- Background: Action Scheduler when available, else WP-Cron single events.
- Hourly incremental sync + event queue delivery to `/plugin/events`.

## Requirements

- WordPress 6+
- PHP 7.4+ (PHP 8.1 recommended)
- WooCommerce active (warning-only if missing)
- HTTPS admin/site URL in production
- Outbound HTTPS to `api.jet-web.ir`

## Install

1. Zip the `wordpress-plugin/` folder or copy to `wp-content/plugins/wordpress-commerce-os-companion/`.
2. Activate in wp-admin → Plugins.
3. Open **WordPress Commerce OS** menu.

## Verification

```bash
chmod +x scripts/verify-plugin-connection.sh
BASE=https://api.jet-web.ir/plugin SITE_ID=... TENANT_ID=... PLUGIN_SECRET=... ./scripts/verify-plugin-connection.sh
```

## Security

See `SECURITY.md` and `CONTRACT.md`. The plugin stores only the backend-issued signing secret (non-autoloaded option). Never commit secrets. Never log raw signing material.

## PHP lint (CI)

```bash
find wordpress-plugin -name '*.php' -print0 | xargs -0 -n1 php -l
```
