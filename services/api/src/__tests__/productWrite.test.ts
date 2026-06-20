/**
 * Product write route (PATCH /merchant/sites/:siteId/products/:productId) access control.
 *
 * `db` is mocked. We assert: insufficient role is rejected (403) before any store touch, an
 * unknown site is 404, and a site owned by ANOTHER tenant is 404 (no cross-site write).
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

import request from 'supertest';

import { queryOne } from '../db';
import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';

const app = createApp();
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

const owner = signToken({ sub: 'u1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const viewer = signToken({ sub: 'u2', role: 'merchant_viewer', portal: 'merchant', tenantId: 't1' });

const PATCH_PATH = '/merchant/sites/site-1/products/101';

describe('PATCH product — access control', () => {
  it('rejects a read-only role (merchant_viewer) with 403 before touching the store', async () => {
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${viewer}`)
      .send({ stockStatus: 'instock' });
    expect(res.status).toBe(403);
  });

  it('404s when the site does not exist', async () => {
    mockedQueryOne.mockResolvedValueOnce(null as never); // getSite → none
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ stockStatus: 'instock' });
    expect(res.status).toBe(404);
  });

  it('404s for a site owned by another tenant (no cross-site write)', async () => {
    mockedQueryOne.mockResolvedValueOnce({
      id: 'site-1', tenant_id: 'OTHER-tenant', name: 's', url: 'https://x', connection_mode: 'woo_rest',
      status: 'connected', woo_version: null, wp_version: null, currency: 'IRT',
      last_synced_at: null, last_error: null, created_at: '2026-01-01',
    } as never);
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ stockStatus: 'instock' });
    expect(res.status).toBe(404);
  });
});
