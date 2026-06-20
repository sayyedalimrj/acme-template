/**
 * Product create route (POST /merchant/sites/:siteId/products) access control + truthful status.
 *
 * `db` and the WooCommerce client are mocked. We assert: a read-only role is rejected (403) before
 * any store touch, a cross-tenant site is 404 (no cross-site create), and a successful create
 * returns the REAL resulting status from WooCommerce (no fake "submitted for review").
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

const mockCreateProduct = jest.fn();
jest.mock('../services/woocommerce/wooClient', () => ({
  createProduct: (...args: unknown[]) => mockCreateProduct(...args),
  // Other exports referenced by the merchant router (unused in these tests).
  getProduct: jest.fn(),
  getOrder: jest.fn(),
  getSalesReport: jest.fn(),
  updateOrderStatus: jest.fn(),
  updateProduct: jest.fn(),
  updateProductStock: jest.fn(),
}));

// getWooCredentials / resyncProduct live in services/sites; stub the bits the route calls.
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
import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';

const app = createApp();
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

const owner = signToken({ sub: 'u1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const viewer = signToken({ sub: 'u2', role: 'merchant_viewer', portal: 'merchant', tenantId: 't1' });
const PATH = '/merchant/sites/site-1/products';

const ownedSite = {
  id: 'site-1', tenant_id: 't1', name: 's', url: 'https://shop.example', connection_mode: 'woo_rest',
  status: 'connected', woo_version: null, wp_version: null, currency: 'IRT',
  last_synced_at: null, last_error: null, created_at: '2026-01-01',
};

beforeEach(() => {
  mockCreateProduct.mockReset();
  mockedQueryOne.mockReset();
});

describe('POST product — access control + truthful status', () => {
  it('rejects a read-only role (merchant_viewer) with 403 before touching the store', async () => {
    const res = await request(app)
      .post(PATH)
      .set('Authorization', `Bearer ${viewer}`)
      .send({ name: 'New', status: 'publish' });
    expect(res.status).toBe(403);
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it('404s for a site owned by another tenant (no cross-site create)', async () => {
    mockedQueryOne.mockResolvedValueOnce({ ...ownedSite, tenant_id: 'OTHER' } as never);
    const res = await request(app)
      .post(PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'New', status: 'publish' });
    expect(res.status).toBe(404);
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it('returns the REAL resulting status from WooCommerce (draft stays draft)', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never); // siteFor → getSite
    mockCreateProduct.mockResolvedValueOnce({
      externalId: '999', name: 'New', sku: '', status: 'draft', type: 'simple',
      permalink: '', priceMinor: 0, currency: 'IRT', stockStatus: 'instock', stockQty: null,
    });
    const res = await request(app)
      .post(PATH)
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'New', status: 'draft' });
    expect(res.status).toBe(201);
    expect(res.body.product.status).toBe('draft');
    expect(res.body.product.external_id).toBe('999');
  });
});
