/**
 * Product write route (PATCH /merchant/sites/:siteId/products/:productId) access control +
 * truthful resulting status.
 *
 * `db`, the WooCommerce client, and the credential/resync helpers are mocked. We assert:
 * insufficient role is rejected (403) before any store touch, an unknown site is 404, a site owned
 * by ANOTHER tenant is 404 (no cross-site write), a successful edit returns the REAL resulting
 * status from WooCommerce, and a WooCommerce failure is surfaced (never a fake success).
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

const mockUpdateProduct = jest.fn();
jest.mock('../services/woocommerce/wooClient', () => ({
  updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
  createProduct: jest.fn(),
  getProduct: jest.fn(),
  getOrder: jest.fn(),
  getSalesReport: jest.fn(),
  updateOrderStatus: jest.fn(),
  updateProductStock: jest.fn(),
}));

jest.mock('../services/sites', () => {
  const actual = jest.requireActual('../services/sites');
  return {
    ...actual,
    getWooCredentials: jest.fn().mockResolvedValue({
      storeUrl: 'https://shop.example',
      consumerKey: 'ck_x',
      consumerSecret: 'cs_x',
    }),
    resyncProduct: jest.fn().mockResolvedValue(undefined),
  };
});

import request from 'supertest';

import { queryOne } from '../db';
import { getWooCredentials } from '../services/sites';
import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';
import { AppError } from '../util/errors';

const app = createApp();
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockedGetCreds = getWooCredentials as jest.MockedFunction<typeof getWooCredentials>;

const owner = signToken({ sub: 'u1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const viewer = signToken({ sub: 'u2', role: 'merchant_viewer', portal: 'merchant', tenantId: 't1' });

const PATCH_PATH = '/merchant/sites/site-1/products/101';

const ownedSite = {
  id: 'site-1', tenant_id: 't1', name: 's', url: 'https://shop.example', connection_mode: 'woo_rest',
  status: 'connected', woo_version: null, wp_version: null, currency: 'IRT',
  last_synced_at: null, last_error: null, created_at: '2026-01-01',
};

beforeEach(() => {
  mockUpdateProduct.mockReset();
  mockedQueryOne.mockReset();
  mockedGetCreds.mockReset();
  mockedGetCreds.mockResolvedValue({
    storeUrl: 'https://shop.example',
    consumerKey: 'ck_x',
    consumerSecret: 'cs_x',
  });
});

describe('PATCH product — access control', () => {
  it('rejects a read-only role (merchant_viewer) with 403 before touching the store', async () => {
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${viewer}`)
      .send({ stockStatus: 'instock' });
    expect(res.status).toBe(403);
    expect(mockUpdateProduct).not.toHaveBeenCalled();
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
    mockedQueryOne.mockResolvedValueOnce({ ...ownedSite, tenant_id: 'OTHER-tenant' } as never);
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ stockStatus: 'instock' });
    expect(res.status).toBe(404);
    expect(mockUpdateProduct).not.toHaveBeenCalled();
  });
});

describe('PATCH product — truthful resulting status + error handling', () => {
  it('returns the REAL resulting status from WooCommerce after an edit', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never); // siteFor → getSite
    mockUpdateProduct.mockResolvedValueOnce({
      externalId: '101', name: 'Edited', sku: 'A1', status: 'publish', type: 'simple',
      priceMinor: 120000, currency: 'IRT', stockStatus: 'instock', stockQty: 5,
      categories: [], images: [],
    });
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Edited', status: 'publish' });
    expect(res.status).toBe(200);
    expect(res.body.product.status).toBe('publish');
    expect(res.body.product.external_id).toBe('101');
  });

  it('returns a truthful 400 (no fake write) when the site has no REST connection', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockedGetCreds.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Edited' });
    expect(res.status).toBe(400);
    expect(mockUpdateProduct).not.toHaveBeenCalled();
    expect(res.body.product).toBeUndefined();
  });

  it('surfaces a WooCommerce failure instead of reporting a fake success', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockUpdateProduct.mockRejectedValueOnce(
      new AppError(502, 'woo_request_failed', 'بروزرسانی در ووکامرس ناموفق بود.'),
    );
    const res = await request(app)
      .patch(PATCH_PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Edited' });
    expect(res.status).toBe(502);
    expect(res.body.product).toBeUndefined();
  });
});
