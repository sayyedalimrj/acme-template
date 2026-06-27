/**
 * Plugin security guards — tenant mismatch and revoked connection rejection.
 */
const SITE = 'site-sec';
const TENANT = 'tenant-sec';
const OTHER_TENANT = 'tenant-other';
const SECRET = 'plugin-signing-secret-sec';

jest.mock('../services/sites', () => ({
  getSite: jest.fn(async () => ({
    id: SITE,
    tenant_id: TENANT,
    connection_mode: 'plugin',
    status: 'connected',
    url: 'https://store.example',
    currency: 'IRT',
  })),
  getPluginSigningSecret: jest.fn(async () => SECRET),
  upsertProductFull: jest.fn(async () => ({ variants: 0, images: 0 })),
}));

jest.mock('../db', () => ({
  pool: {},
  queryOne: jest.fn(async (sql: string) => {
    if (/FROM plugin_connection/.test(sql)) return { status: 'connected' };
    return null;
  }),
  query: jest.fn(async (sql: string) => {
    if (/INSERT INTO replay_nonce/.test(sql)) return [{ id: 'n1' }];
    return [];
  }),
}));

import request from 'supertest';

import { createApp } from '../http/app';
import { computeSignature } from '../services/plugin/signature';

const app = createApp();

function signedHeaders(bodyString: string, tenantId: string): Record<string, string> {
  const timestamp = new Date().toISOString();
  const nonce = `nonce-sec-${Date.now()}-${Math.random()}`;
  const pluginVersion = '1.1.0';
  const signature = computeSignature(
    { siteId: SITE, tenantId, timestamp, nonce, pluginVersion, bodyString },
    SECRET,
  );
  return {
    'Content-Type': 'text/plain',
    'x-wcos-site-id': SITE,
    'x-wcos-tenant-id': tenantId,
    'x-wcos-timestamp': timestamp,
    'x-wcos-nonce': nonce,
    'x-wcos-plugin-version': pluginVersion,
    'x-wcos-signature': signature,
  };
}

describe('plugin security guards', () => {
  it('rejects wrong tenant header (403)', async () => {
    const body = '{}';
    const res = await request(app)
      .post('/plugin/health')
      .set(signedHeaders(body, OTHER_TENANT))
      .send(body);
    expect(res.status).toBe(403);
  });

  it('accepts matching tenant header', async () => {
    const body = '{}';
    const res = await request(app)
      .post('/plugin/health')
      .set(signedHeaders(body, TENANT))
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
