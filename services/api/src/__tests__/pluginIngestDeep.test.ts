/**
 * Plugin transport preserves the full product structure too.
 *
 * The plugin's signed sync envelope is routed through the SAME `upsertProductFull` path as the
 * REST sync, so raw/meta/categories/tags/brands/attributes/images/variations are all preserved.
 * `db` and `sites` are mocked; we assert the envelope→normalized mapping keeps everything.
 */
jest.mock('../db', () => ({ query: jest.fn().mockResolvedValue([{ id: 'run-1' }]), queryOne: jest.fn(), pool: {} }));
jest.mock('../services/sites', () => ({
  getSite: jest.fn().mockResolvedValue({ currency: 'IRT', tenant_id: 'tenant-A' }),
  upsertProductFull: jest.fn().mockResolvedValue({ variants: 0, images: 0 }),
}));

import { upsertProductFull } from '../services/sites';
import { ingestSyncEnvelope } from '../services/plugin/ingest';

const mockedUpsert = upsertProductFull as jest.MockedFunction<typeof upsertProductFull>;

beforeEach(() => mockedUpsert.mockClear());

describe('plugin ingest — deep preservation via shared path', () => {
  it('maps an envelope product (with deep fields) to a NormalizedProduct and upserts it', async () => {
    await ingestSyncEnvelope('site-A', 'tenant-A', {
      schemaVersion: '1',
      site: { currency: 'IRT' },
      data: {
        categories: [{ id: 7, name: 'عمومی', slug: 'general' }],
        products: [
          {
            id: 123,
            name: 'عبای محرم',
            type: 'variable',
            sku: 'ABA',
            status: 'publish',
            price_minor: 1850000,
            stock_status: 'instock',
            categories: [{ id: 7, name: 'عمومی' }],
            tags: [{ id: 30, name: 'محرم' }],
            brands: [{ id: 5, name: 'دورا' }],
            attributes: [{ id: 2, name: 'pa_size', options: ['1', '2', '3'], variation: true }],
            images: [{ id: 900, src: 'https://dora.example/f.jpg', position: 0 }],
            meta_data: [{ key: '_woodmart_product_360', value: 'on' }],
            raw: { id: 123, foo: 'bar', meta_data: [{ key: '_woodmart_product_360', value: 'on' }] },
            variations: [
              { id: 5001, sku: 'ABA-S1', price_minor: 1850000, meta_data: [{ key: '_pos', value: 'y' }], raw: { id: 5001 } },
            ],
          },
        ],
      },
    });

    expect(mockedUpsert).toHaveBeenCalledTimes(1);
    const [siteId, tenantId, product, variations] = mockedUpsert.mock.calls[0];
    expect(siteId).toBe('site-A');
    expect(tenantId).toBe('tenant-A');
    expect(product.externalId).toBe('123');
    expect(product.type).toBe('variable');
    expect(product.categories).toEqual([{ externalId: '7', name: 'عمومی' }]);
    expect(product.tags[0].externalId).toBe('30');
    expect(product.brands[0].externalId).toBe('5');
    expect(product.productAttributes[0]).toMatchObject({ name: 'pa_size', isVariation: true, options: ['1', '2', '3'] });
    expect(product.images[0].src).toBe('https://dora.example/f.jpg');
    // raw + meta preserved (nothing lost via the plugin transport either).
    expect(product.raw).toEqual({ id: 123, foo: 'bar', meta_data: [{ key: '_woodmart_product_360', value: 'on' }] });
    expect(product.meta).toEqual([{ key: '_woodmart_product_360', value: 'on' }]);
    // variations carried with their meta.
    expect(variations).toHaveLength(1);
    expect(variations![0].externalId).toBe('5001');
    expect(variations![0].meta).toEqual([{ key: '_pos', value: 'y' }]);
  });
});
