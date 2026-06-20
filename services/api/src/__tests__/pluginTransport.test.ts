/**
 * Plugin transport end-to-end smoke test (the JetWeb Connector → backend flow).
 *
 * Runs the REAL Express app and REAL HMAC verification against a `db` mock that faithfully enforces
 * nonce-replay (unique (site_id, nonce)) and event idempotency (ON CONFLICT (site_id,
 * idempotency_key)). Proves, without a live store: handshake, signed sync of the Dora «عبای محرم»
 * variable product (deep fields reach `upsertProductFull`), health, bad-signature rejection,
 * nonce-replay rejection, and event idempotency (duplicate event records 0 the second time).
 *
 * A live Dora run uses the same routes — see scripts/smoke-dora.mjs + DEPLOYMENT.md.
 */
const SITE = 'site-dora';
const TENANT = 'tenant-dora';
const SECRET = 'plugin-signing-secret-abc123';

const seenNonces = new Set<string>();
const seenEventKeys = new Set<string>();

jest.mock('../services/sites', () => ({
  getSite: jest.fn(async () => ({
    id: SITE, tenant_id: TENANT, connection_mode: 'plugin', status: 'connected',
    url: 'https://dora.example', currency: 'IRT',
  })),
  getPluginSigningSecret: jest.fn(async () => SECRET),
  upsertProductFull: jest.fn(async () => ({ variants: 0, images: 0 })),
}));

jest.mock('../db', () => ({
  pool: {},
  queryOne: jest.fn(async () => null),
  query: jest.fn(async (sql: string, params: unknown[] = []) => {
    if (/INSERT INTO replay_nonce/.test(sql)) {
      const nonce = String(params[1]);
      if (seenNonces.has(nonce)) return []; // replay → not fresh
      seenNonces.add(nonce);
      return [{ id: 'nonce-row' }];
    }
    if (/INSERT INTO plugin_event/.test(sql)) {
      const key = String(params[3]);
      if (seenEventKeys.has(key)) return []; // idempotent → not recorded again
      seenEventKeys.add(key);
      return [{ id: 'event-row' }];
    }
    if (/INSERT INTO sync_run/.test(sql)) return [{ id: 'run-1' }];
    return [];
  }),
}));

import request from 'supertest';

import { createApp } from '../http/app';
import { upsertProductFull } from '../services/sites';
import { computeSignature } from '../services/plugin/signature';

const app = createApp();
const mockedUpsert = upsertProductFull as jest.MockedFunction<typeof upsertProductFull>;

let nonceSeq = 0;
function signedHeaders(bodyString: string): Record<string, string> {
  const timestamp = new Date().toISOString();
  const nonce = `nonce-${Date.now()}-${nonceSeq++}`;
  const pluginVersion = '1.0.0';
  const signature = computeSignature(
    { siteId: SITE, tenantId: TENANT, timestamp, nonce, pluginVersion, bodyString },
    SECRET,
  );
  return {
    'Content-Type': 'text/plain',
    'x-wcos-site-id': SITE,
    'x-wcos-timestamp': timestamp,
    'x-wcos-nonce': nonce,
    'x-wcos-plugin-version': pluginVersion,
    'x-wcos-signature': signature,
  };
}

function post(path: string, bodyString: string, headers: Record<string, string>) {
  return request(app).post(path).set(headers).send(bodyString);
}

const DORA_ENVELOPE = JSON.stringify({
  schemaVersion: '1',
  site: { currency: 'IRT' },
  data: {
    categories: [{ id: 7, name: 'عمومی', slug: 'general' }],
    tags: [{ id: 30, name: 'محرم' }],
    brands: [{ id: 5, name: 'دورا' }],
    products: [
      {
        id: 123, name: 'عبای محرم', type: 'variable', sku: 'ABA-MOH', status: 'publish',
        price_minor: 1850000, regular_price_minor: 2000000, sale_price_minor: 1850000,
        stock_status: 'instock', stock_qty: 9,
        categories: [{ id: 7, name: 'عمومی' }],
        tags: [{ id: 30, name: 'محرم' }],
        brands: [{ id: 5, name: 'دورا' }],
        attributes: [{ id: 2, name: 'pa_size', options: ['1', '2', '3'], variation: true }],
        images: [{ id: 900, src: 'https://dora.example/f.jpg', position: 0 }],
        meta_data: [{ key: '_woodmart_product_360', value: 'on' }],
        raw: { id: 123, meta_data: [{ key: '_woodmart_product_360', value: 'on' }] },
        variations: [{ id: 5001, sku: 'ABA-S1', price_minor: 1850000, meta_data: [{ key: '_pos', value: 'y' }] }],
      },
    ],
  },
});

beforeEach(() => {
  seenNonces.clear();
  seenEventKeys.clear();
  mockedUpsert.mockClear();
});

describe('plugin transport E2E (Dora flow)', () => {
  it('handshake: a correctly signed request connects the site', async () => {
    const body = JSON.stringify({ wooVersion: '9.4.0', wpVersion: '6.7' });
    const res = await post('/plugin/handshake', body, signedHeaders(body));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, status: 'connected', siteId: SITE });
  });

  it('health: signed heartbeat works', async () => {
    const body = '{}';
    const res = await post('/plugin/health', body, signedHeaders(body));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects a tampered/invalid signature (401)', async () => {
    const body = JSON.stringify({ schemaVersion: '1' });
    const headers = signedHeaders(body);
    headers['x-wcos-signature'] = 'deadbeef';
    const res = await post('/plugin/sync', body, headers);
    expect(res.status).toBe(401);
  });

  it('sync: ingests the Dora عبای محرم product with deep fields preserved', async () => {
    const res = await post('/plugin/sync', DORA_ENVELOPE, signedHeaders(DORA_ENVELOPE));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mockedUpsert).toHaveBeenCalledTimes(1);
    const [siteId, tenantId, product, variations] = mockedUpsert.mock.calls[0];
    expect(siteId).toBe(SITE);
    expect(tenantId).toBe(TENANT);
    expect(product.externalId).toBe('123');
    expect(product.type).toBe('variable');
    expect(product.productAttributes[0]).toMatchObject({ name: 'pa_size', isVariation: true });
    expect(product.meta).toEqual([{ key: '_woodmart_product_360', value: 'on' }]);
    expect(variations![0].externalId).toBe('5001');
  });

  it('rejects a replayed nonce (401 on the second identical request)', async () => {
    const body = '{}';
    const headers = signedHeaders(body);
    const first = await post('/plugin/health', body, headers);
    expect(first.status).toBe(200);
    const replay = await post('/plugin/health', body, headers); // same nonce + signature
    expect(replay.status).toBe(401);
  });

  it('events: a duplicate event is idempotent (recorded once)', async () => {
    const event = { idempotencyKey: 'evt-key-1', type: 'product.updated', summary: { id: 123 } };
    const body = JSON.stringify({ events: [event] });
    const r1 = await post('/plugin/events', body, signedHeaders(body)); // fresh nonce
    expect(r1.status).toBe(200);
    expect(r1.body.recorded).toBe(1);
    const r2 = await post('/plugin/events', body, signedHeaders(body)); // new nonce, same event key
    expect(r2.status).toBe(200);
    expect(r2.body.recorded).toBe(0); // ON CONFLICT (site_id, idempotency_key) → not re-recorded
  });
});
