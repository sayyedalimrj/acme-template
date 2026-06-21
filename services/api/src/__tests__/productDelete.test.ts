/**
 * Product delete route (DELETE /merchant/sites/:siteId/products/:productId).
 *
 * `db`, the WooCommerce client and credential helper are mocked. We assert: a read-only role is
 * 403 before any store touch, a cross-tenant site is 404, a successful delete calls Woo
 * (default = trash, force=false) and removes the local read-model, and no REST connection → 400.
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

const mockDeleteProduct = jest.fn();
jest.mock('../services/woocommerce/wooClient', () => ({
  deleteProduct: (...args: unknown[]) => mockDeleteProduct(...args),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
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
  };
});

import request from 'supertest';

import { queryOne } from '../db';
import { getWooCredentials } from '../services/sites';
import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';

const app = createApp();
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockedGetCreds = getWooCredentials as jest.MockedFunction<typeof getWooCredentials>;

const owner = signToken({ sub: 'u1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const viewer = signToken({ sub: 'u2', role: 'merchant_viewer', portal: 'merchant', tenantId: 't1' });

const PATH = '/merchant/sites/site-1/products/101';
const ownedSite = {
  id: 'site-1', tenant_id: 't1', name: 's', url: 'https://shop.example', connection_mode: 'woo_rest',
  status: 'connected', woo_version: null, wp_version: null, currency: 'IRT',
  last_synced_at: null, last_error: null, created_at: '2026-01-01',
};

beforeEach(() => {
  mockDeleteProduct.mockReset();
  mockedQueryOne.mockReset();
  mockedGetCreds.mockReset();
  mockedGetCreds.mockResolvedValue({ storeUrl: 'https://shop.example', consumerKey: 'ck_x', consumerSecret: 'cs_x' });
});

describe('DELETE product', () => {
  it('rejects a read-only role with 403 before touching the store', async () => {
    const res = await request(app).delete(PATH).set('Authorization', `Bearer ${viewer}`);
    expect(res.status).toBe(403);
    expect(mockDeleteProduct).not.toHaveBeenCalled();
  });

  it('404s for a site owned by another tenant (no cross-site delete)', async () => {
    mockedQueryOne.mockResolvedValueOnce({ ...ownedSite, tenant_id: 'OTHER' } as never);
    const res = await request(app).delete(PATH).set('Authorization', `Bearer ${owner}`);
    expect(res.status).toBe(404);
    expect(mockDeleteProduct).not.toHaveBeenCalled();
  });

  it('trashes the product in Woo (force=false) and reports success', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never); // siteFor → getSite
    mockDeleteProduct.mockResolvedValueOnce({ externalId: '101' });
    const res = await request(app).delete(PATH).set('Authorization', `Bearer ${owner}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.force).toBe(false);
    expect(mockDeleteProduct).toHaveBeenCalledWith(
      expect.anything(),
      '101',
      false,
    );
  });

  it('returns a truthful 400 when the site has no REST connection', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockedGetCreds.mockResolvedValueOnce(null);
    const res = await request(app).delete(PATH).set('Authorization', `Bearer ${owner}`);
    expect(res.status).toBe(400);
    expect(mockDeleteProduct).not.toHaveBeenCalled();
  });
});
