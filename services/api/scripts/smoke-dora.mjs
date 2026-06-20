#!/usr/bin/env node
/**
 * Live plugin-transport smoke test (operator-run, against a REAL backend + site).
 *
 * This signs requests exactly like the JetWeb Connector plugin and hits the live signed transport,
 * so you can verify a real store (e.g. Dora) end-to-end without the WordPress UI. It reads ALL
 * secrets from the environment — nothing is committed.
 *
 * Usage (example — replace with your real values; do NOT hardcode/commit secrets):
 *   JETWEB_API_BASE=https://api.jet-web.ir \
 *   WCOS_SITE_ID=<uuid> WCOS_TENANT_ID=<uuid> WCOS_SIGNING_SECRET=<secret> \
 *   WCOS_PLUGIN_VERSION=1.0.0 \
 *   node scripts/smoke-dora.mjs health        # signed heartbeat
 *   node scripts/smoke-dora.mjs handshake     # mark connected
 *   node scripts/smoke-dora.mjs sync <file.json>   # POST a signed sync envelope (JSON file)
 *
 * Pairing itself happens in WordPress: install the plugin (wordpress-plugin/), open JetWeb
 * Connector settings, paste the one-time pairing code from the JetWeb merchant portal, and Save.
 * The plugin then stores the per-site signing secret and uses these same endpoints.
 */
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API = process.env.JETWEB_API_BASE;
const SITE = process.env.WCOS_SITE_ID;
const TENANT = process.env.WCOS_TENANT_ID ?? '';
const SECRET = process.env.WCOS_SIGNING_SECRET;
const VERSION = process.env.WCOS_PLUGIN_VERSION ?? '1.0.0';

if (!API || !SITE || !SECRET) {
  console.error('Missing env: JETWEB_API_BASE, WCOS_SITE_ID, WCOS_SIGNING_SECRET are required.');
  process.exit(2);
}

function sign(bodyString) {
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const bodyHash = createHash('sha256').update(bodyString, 'utf8').digest('hex');
  const base = [SITE, TENANT, timestamp, nonce, VERSION, bodyHash].join('\n');
  const signature = createHmac('sha256', SECRET).update(base, 'utf8').digest('hex');
  return {
    'content-type': 'text/plain',
    'x-wcos-site-id': SITE,
    'x-wcos-tenant-id': TENANT,
    'x-wcos-timestamp': timestamp,
    'x-wcos-nonce': nonce,
    'x-wcos-plugin-version': VERSION,
    'x-wcos-signature': signature,
  };
}

async function call(path, bodyString) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: sign(bodyString), body: bodyString });
  const text = await res.text();
  console.log(`POST ${path} → ${res.status}`);
  console.log(text.slice(0, 2000));
  if (!res.ok) process.exitCode = 1;
}

const cmd = process.argv[2] ?? 'health';
if (cmd === 'health') await call('/plugin/health', '{}');
else if (cmd === 'handshake') await call('/plugin/handshake', JSON.stringify({ wooVersion: process.env.WOO_VERSION ?? '', wpVersion: process.env.WP_VERSION ?? '' }));
else if (cmd === 'sync') {
  const file = process.argv[3];
  if (!file) { console.error('sync requires a JSON envelope file path'); process.exit(2); }
  await call('/plugin/sync', readFileSync(file, 'utf8'));
} else {
  console.error(`Unknown command: ${cmd} (use health|handshake|sync)`);
  process.exit(2);
}
