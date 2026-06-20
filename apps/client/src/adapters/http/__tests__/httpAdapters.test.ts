/* eslint-disable import/first */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { minorToMoney } from '@/domain/money';

// Mock the HTTP client so adapters can be tested without a network.
jest.mock('@/services/httpClient', () => ({
  http: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), del: jest.fn() },
  qs: (p: Record<string, unknown>) =>
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('&'),
}));

import { http } from '@/services/httpClient';
import { createHttpProductAdapter } from '@/adapters/http/httpProductAdapter';
import { createHttpOrderAdapter } from '@/adapters/http/httpOrderAdapter';
import { setActiveHttpSiteId } from '@/adapters/http/httpActiveSite';

const mockedGet = http.get as jest.MockedFunction<typeof http.get>;

describe('minorToMoney', () => {
  it('converts minor units to decimal strings by currency', () => {
    expect(minorToMoney(185050, 'USD')).toBe('1850.50');
    expect(minorToMoney(1850, 'IRT')).toBe('1850');
    expect(minorToMoney(0, 'IRT')).toBe('0');
  });
});

describe('http product adapter mapping', () => {
  beforeEach(() => setActiveHttpSiteId('site-1'));

  it('maps backend read-model rows onto the Product domain type', async () => {
    mockedGet.mockResolvedValueOnce({
      items: [
        {
          external_id: '101',
          name: 'کفش',
          sku: 'SH-101',
          status: 'publish',
          price_minor: 1850000,
          currency: 'IRT',
          stock_status: 'instock',
          stock_qty: 24,
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    } as never);

    const adapter = createHttpProductAdapter();
    const page = await adapter.listProducts({ page: 1 });
    expect(page.total).toBe(1);
    const p = page.items[0];
    expect(p.id).toBe('101');
    expect(p.price).toBe('1850000'); // IRT = 0 decimals
    expect(p.stockStatus).toBe('instock');
    expect(p.manageStock).toBe(true);
  });

  it('maps synced images and categories (detail) and primary image (list)', async () => {
    setActiveHttpSiteId('site-1');
    mockedGet.mockResolvedValueOnce({
      product: {
        external_id: '101', name: 'کفش', sku: 'SH-101', status: 'publish', type: 'variable',
        price_minor: 1850000, currency: 'IRT', stock_status: 'instock', stock_qty: 24,
        images: [{ src: 'https://s/a.jpg', alt: 'a', position: 0 }],
        categories: [{ external_id: '7', name: 'پوشاک' }],
        permalink: 'https://shop/p/101',
        admin_edit_url: 'https://shop/wp-admin/post.php?post=101&action=edit',
      },
    } as never);
    const adapter = createHttpProductAdapter();
    const p = await adapter.getProduct('101');
    expect(p.type).toBe('variable');
    expect(p.images).toHaveLength(1);
    expect(p.images[0].src).toBe('https://s/a.jpg');
    expect(p.categories).toEqual([{ id: '7', name: 'پوشاک', slug: '7' }]);
    expect(p.permalink).toBe('https://shop/p/101');
    expect(p.adminEditUrl).toBe('https://shop/wp-admin/post.php?post=101&action=edit');
  });

  it('updateProduct PATCHes the controlled fields and maps the result', async () => {
    setActiveHttpSiteId('site-1');
    const mockedPatch = http.patch as jest.MockedFunction<typeof http.patch>;
    mockedPatch.mockResolvedValueOnce({
      product: {
        external_id: '101', name: 'کفش جدید', sku: 'SH-101', status: 'draft', type: 'simple',
        price_minor: 990000, currency: 'IRT', stock_status: 'outofstock', stock_qty: 0,
        images: [], categories: [],
      },
    } as never);
    const adapter = createHttpProductAdapter();
    const updated = await adapter.updateProduct('101', {
      name: 'کفش جدید',
      regularPrice: 99000,
      status: 'draft',
      stockQuantity: 0,
      stockStatus: 'outofstock',
      categoryIds: ['7'],
    });
    expect(mockedPatch).toHaveBeenCalledWith(
      '/merchant/sites/site-1/products/101',
      expect.objectContaining({
        name: 'کفش جدید',
        regularPrice: '99000', // major-unit string for WooCommerce
        status: 'draft',
        stockQuantity: 0,
        stockStatus: 'outofstock',
        categoryExternalIds: ['7'],
      }),
    );
    expect(updated.name).toBe('کفش جدید');
    expect(updated.status).toBe('draft');
  });

  it('throws when no active site is selected', async () => {
    setActiveHttpSiteId(null);
    const adapter = createHttpProductAdapter();
    await expect(adapter.listProducts()).rejects.toThrow();
  });
});

describe('http order adapter mapping', () => {
  beforeEach(() => setActiveHttpSiteId('site-1'));

  it('derives fulfillment + money from the order read-model', async () => {
    mockedGet.mockResolvedValueOnce({
      items: [
        {
          external_id: '500',
          number: '#500',
          status: 'completed',
          total_minor: 920000,
          currency: 'IRT',
          customer_name: 'نیلوفر کاظمی',
          external_created_at: '2026-01-01T00:00:00Z',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    } as never);

    const adapter = createHttpOrderAdapter();
    const page = await adapter.listOrders();
    const o = page.items[0];
    expect(o.status).toBe('completed');
    expect(o.fulfillment).toBe('fulfilled');
    expect(o.total).toBe('920000');
    expect(o.billing.firstName).toBe('نیلوفر');
  });
});
