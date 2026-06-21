/**
 * Product media routes: list all images, replace/reorder/set-cover (PATCH), and upload (POST).
 * `db`, the WooCommerce client, and the credential/resync helpers are mocked. We assert RBAC,
 * tenant isolation, the full gallery is returned (not just the cover), a successful upload, and a
 * truthful upload-unsupported error (no fake success, no WordPress redirect).
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

const mockGetProduct = jest.fn();
const mockSetProductImages = jest.fn();
const mockUploadProductMedia = jest.fn();
jest.mock('../services/woocommerce/wooClient', () => ({
  getProduct: (...a: unknown[]) => mockGetProduct(...a),
  setProductImages: (...a: unknown[]) => mockSetProductImages(...a),
  uploadProductMedia: (...a: unknown[]) => mockUploadProductMedia(...a),
  getOrder: jest.fn(),
  getSalesReport: jest.fn(),
  createProduct: jest.fn(),
  deleteProduct: jest.fn(),
  updateOrderStatus: jest.fn(),
  updateProduct: jest.fn(),
  updateProductStock: jest.fn(),
}));

jest.mock('../services/sites', () => {
  const actual = jest.requireActual('../services/sites');
  return {
    ...actual,
    getWooCredentials: jest.fn().mockResolvedValue({
      storeUrl: 'https://shop.example', consumerKey: 'ck_x', consumerSecret: 'cs_x',
    }),
    resyncProduct: jest.fn().mockResolvedValue(undefined),
  };
});

import request from 'supertest';

import { queryOne } from '../db';
import { getWooCredentials } from '../services/sites';
import { AppError } from '../util/errors';
import { createApp } from '../http/app';
import { signToken } from '../services/tokenService';

const app = createApp();
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockedGetCreds = getWooCredentials as jest.MockedFunction<typeof getWooCredentials>;

const owner = signToken({ sub: 'u1', role: 'merchant_owner', portal: 'merchant', tenantId: 't1' });
const viewer = signToken({ sub: 'u2', role: 'merchant_viewer', portal: 'merchant', tenantId: 't1' });

const ownedSite = {
  id: 'site-1', tenant_id: 't1', name: 's', url: 'https://shop.example', connection_mode: 'woo_rest',
  status: 'connected', woo_version: null, wp_version: null, currency: 'IRT',
  last_synced_at: null, last_error: null, created_at: '2026-01-01',
};
const productWithImages = {
  externalId: '101', name: 'p', images: [
    { externalId: '11', src: 'https://shop.example/a.jpg', alt: 'a', position: 0 },
    { externalId: '12', src: 'https://shop.example/b.jpg', alt: 'b', position: 1 },
  ],
};

beforeEach(() => {
  mockGetProduct.mockReset();
  mockSetProductImages.mockReset();
  mockUploadProductMedia.mockReset();
  mockedQueryOne.mockReset();
  mockedGetCreds.mockReset();
  mockedGetCreds.mockResolvedValue({ storeUrl: 'https://shop.example', consumerKey: 'ck_x', consumerSecret: 'cs_x' });
});

describe('GET product media', () => {
  it('returns ALL images (gallery), with the first marked as cover', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockGetProduct.mockResolvedValueOnce(productWithImages);
    const res = await request(app)
      .get('/merchant/sites/site-1/products/101/media')
      .set('Authorization', `Bearer ${owner}`);
    expect(res.status).toBe(200);
    expect(res.body.images).toHaveLength(2);
    expect(res.body.images[0].isCover).toBe(true);
    expect(res.body.images[1].isCover).toBe(false);
  });

  it('404s for a cross-tenant site', async () => {
    mockedQueryOne.mockResolvedValueOnce({ ...ownedSite, tenant_id: 'OTHER' } as never);
    const res = await request(app)
      .get('/merchant/sites/site-1/products/101/media')
      .set('Authorization', `Bearer ${owner}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH product media', () => {
  it('rejects a read-only role with 403', async () => {
    const res = await request(app)
      .patch('/merchant/sites/site-1/products/101/media')
      .set('Authorization', `Bearer ${viewer}`)
      .send({ images: [{ id: '12' }, { id: '11' }] });
    expect(res.status).toBe(403);
    expect(mockSetProductImages).not.toHaveBeenCalled();
  });

  it('reorders/sets cover via the ordered images array and returns the new gallery', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockSetProductImages.mockResolvedValueOnce({
      externalId: '101', name: 'p', images: [
        { externalId: '12', src: 'https://shop.example/b.jpg', alt: 'b', position: 0 },
        { externalId: '11', src: 'https://shop.example/a.jpg', alt: 'a', position: 1 },
      ],
    });
    const res = await request(app)
      .patch('/merchant/sites/site-1/products/101/media')
      .set('Authorization', `Bearer ${owner}`)
      .send({ images: [{ id: '12' }, { id: '11' }] });
    expect(res.status).toBe(200);
    expect(res.body.images[0].id).toBe('12');
    expect(res.body.images[0].isCover).toBe(true);
    expect(mockSetProductImages).toHaveBeenCalledWith(expect.anything(), '101', [{ id: '12' }, { id: '11' }]);
  });
});

describe('POST media upload', () => {
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUg==', 'base64').toString('base64');

  it('uploads an image and returns its media id + url', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockUploadProductMedia.mockResolvedValueOnce({ id: '900', src: 'https://shop.example/up.jpg', alt: null });
    const res = await request(app)
      .post('/merchant/sites/site-1/media')
      .set('Authorization', `Bearer ${owner}`)
      .send({ filename: 'photo.jpg', contentType: 'image/jpeg', dataBase64: tinyPng });
    expect(res.status).toBe(201);
    expect(res.body.media.id).toBe('900');
    expect(res.body.media.src).toContain('up.jpg');
  });

  it('surfaces a truthful unsupported error (no fake success) when the store rejects media upload', async () => {
    mockedQueryOne.mockResolvedValueOnce(ownedSite as never);
    mockUploadProductMedia.mockRejectedValueOnce(
      new AppError(502, 'woo_media_unsupported', 'کلیدهای فعلی اجازه بارگذاری رسانه را ندارند.'),
    );
    const res = await request(app)
      .post('/merchant/sites/site-1/media')
      .set('Authorization', `Bearer ${owner}`)
      .send({ filename: 'photo.jpg', contentType: 'image/jpeg', dataBase64: tinyPng });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('woo_media_unsupported');
    expect(res.body.media).toBeUndefined();
  });
});
