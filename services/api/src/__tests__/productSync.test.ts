/**
 * Product catalog sync: tenant/site scoping, idempotency, and category/image/variation handling.
 *
 * `db` is mocked (no Postgres). We drive `upsertProductFull` directly and assert the SQL it emits
 * is site/tenant scoped, idempotent (upsert on (site_id, external_id); per-product images and
 * category links replaced), and that variations are pulled only for variable products.
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([{ id: 'prod-uuid' }]),
  queryOne: jest.fn(),
  pool: { connect: jest.fn() },
}));
jest.mock('../services/woocommerce/wooClient');

import { query } from '../db';
import { upsertProductFull } from '../services/sites';
import { listProductVariations, type NormalizedProduct } from '../services/woocommerce/wooClient';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedVariations = listProductVariations as jest.MockedFunction<typeof listProductVariations>;

const SITE_A = 'site-A';
const TENANT_A = 'tenant-A';

const creds = { storeUrl: 'https://shop.example', consumerKey: 'ck', consumerSecret: 'cs' };

function product(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
  return {
    externalId: '101',
    name: 'محصول تست',
    sku: 'SKU-101',
    status: 'publish',
    type: 'simple',
    priceMinor: 120000,
    currency: 'IRT',
    stockStatus: 'instock',
    stockQty: 5,
    categories: [{ externalId: '7', name: 'پوشاک' }],
    images: [
      { externalId: '900', src: 'https://shop.example/a.jpg', alt: 'a', position: 0 },
      { externalId: '901', src: 'https://shop.example/b.jpg', alt: 'b', position: 1 },
    ],
    attributes: null,
    raw: { id: 101 },
    ...overrides,
  };
}

/** All (sql, params) pairs the mocked query received. */
function calls(): Array<{ sql: string; params: unknown[] }> {
  return mockedQuery.mock.calls.map((c) => ({ sql: c[0] as string, params: (c[1] as unknown[]) ?? [] }));
}

beforeEach(() => {
  mockedQuery.mockClear();
  mockedQuery.mockResolvedValue([{ id: 'prod-uuid' }] as never);
});

describe('upsertProductFull — scoping + idempotency', () => {
  it('upserts the product scoped to site + tenant, idempotently (ON CONFLICT)', async () => {
    await upsertProductFull(SITE_A, TENANT_A, creds, product());
    const insert = calls().find((c) => /INSERT INTO synced_product\b/.test(c.sql));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain('ON CONFLICT (site_id, external_id)');
    // site_id + tenant_id are the first two params → no cross-tenant/site leakage.
    expect(insert!.params[0]).toBe(SITE_A);
    expect(insert!.params[1]).toBe(TENANT_A);
    expect(insert!.params[2]).toBe('101');
  });

  it('replaces category links per product (delete-then-insert) so repeated sync never duplicates', async () => {
    await upsertProductFull(SITE_A, TENANT_A, creds, product());
    const del = calls().find((c) => /DELETE FROM synced_product_category/.test(c.sql));
    const ins = calls().find((c) => /INSERT INTO synced_product_category/.test(c.sql));
    expect(del).toBeDefined();
    expect(ins).toBeDefined();
    // Link resolves to a category of the SAME site (scoped subselect).
    expect(ins!.sql).toContain('sc.site_id = $3 AND sc.external_id = $4');
    expect(ins!.params).toEqual(['prod-uuid', TENANT_A, SITE_A, '7']);
  });

  it('replaces images per product (delete-then-insert), scoped to site + tenant', async () => {
    await upsertProductFull(SITE_A, TENANT_A, creds, product());
    const del = calls().find((c) => /DELETE FROM synced_product_image/.test(c.sql));
    const imageInserts = calls().filter((c) => /INSERT INTO synced_product_image/.test(c.sql));
    expect(del).toBeDefined();
    expect(imageInserts).toHaveLength(2);
    for (const ins of imageInserts) {
      expect(ins.params[0]).toBe(TENANT_A);
      expect(ins.params[1]).toBe(SITE_A);
      expect(ins.params[2]).toBe('prod-uuid');
    }
  });

  it('does NOT fetch variations for a simple product', async () => {
    await upsertProductFull(SITE_A, TENANT_A, creds, product({ type: 'simple' }));
    expect(mockedVariations).not.toHaveBeenCalled();
  });

  it('syncs variations for a variable product, upserting them scoped + idempotently', async () => {
    mockedVariations.mockResolvedValueOnce({
      items: [
        {
          externalId: '5001', sku: 'SKU-101-S', priceMinor: 120000, currency: 'IRT',
          stockStatus: 'instock', stockQty: 3, attributes: [{ name: 'size', option: 'S' }], raw: { id: 5001 },
        },
      ],
      page: 1,
      pageSize: 100,
      total: 1,
    } as never);

    const counts = await upsertProductFull(SITE_A, TENANT_A, creds, product({ type: 'variable' }));
    expect(mockedVariations).toHaveBeenCalledWith(creds, '101', { page: 1, pageSize: 100 });
    expect(counts.variants).toBe(1);
    const variantInsert = calls().find((c) => /INSERT INTO synced_product_variant/.test(c.sql));
    expect(variantInsert).toBeDefined();
    expect(variantInsert!.sql).toContain('ON CONFLICT (site_id, external_id)');
    expect(variantInsert!.params[0]).toBe(TENANT_A);
    expect(variantInsert!.params[1]).toBe(SITE_A);
    expect(variantInsert!.params[2]).toBe('prod-uuid');
    expect(variantInsert!.params[3]).toBe('5001');
  });
});
