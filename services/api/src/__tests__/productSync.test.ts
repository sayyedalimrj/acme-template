/**
 * Deep product catalog sync: tenant/site scoping, idempotency, and full preservation of
 * categories, tags, brands, per-product attributes, images, variations + meta/raw.
 *
 * `db` is mocked (no Postgres). We drive `upsertProductFull` (variations passed in, no creds) and
 * assert the SQL it emits is site/tenant scoped, idempotent (upsert on (site_id, external_id);
 * per-product links/images/attributes replaced), and that meta_data + raw are persisted losslessly.
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([{ id: 'prod-uuid' }]),
  queryOne: jest.fn(),
  pool: { connect: jest.fn() },
}));

import { query } from '../db';
import { upsertProductFull } from '../services/sites';
import type { NormalizedProduct, NormalizedVariation } from '../services/woocommerce/wooClient';

const mockedQuery = query as jest.MockedFunction<typeof query>;

const SITE_A = 'site-A';
const TENANT_A = 'tenant-A';

function product(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
  return {
    externalId: '101',
    name: 'عبای محرم',
    sku: 'ABA-101',
    status: 'publish',
    type: 'variable',
    permalink: 'https://shop.example/product/aba',
    priceMinor: 1850000,
    regularPriceMinor: 1850000,
    salePriceMinor: null,
    currency: 'IRT',
    stockStatus: 'instock',
    stockQty: 12,
    categories: [{ externalId: '7', name: 'عمومی' }],
    tags: [{ externalId: '30', name: 'محرم', slug: 'moharram' }],
    brands: [{ externalId: '5', name: 'دورا', slug: 'dora' }],
    productAttributes: [
      { externalId: '2', name: 'pa_size', slug: 'pa_size', options: ['1', '2', '3'], isVariation: true, isVisible: true, position: 0, raw: { id: 2 } },
    ],
    images: [
      { externalId: '900', src: 'https://shop.example/featured.jpg', alt: 'featured', position: 0 },
      { externalId: '901', src: 'https://shop.example/g1.jpg', alt: 'g1', position: 1 },
    ],
    attributes: [{ id: 2, name: 'pa_size', options: ['1', '2', '3'], variation: true }],
    meta: [{ key: '_wcos_size_guide', value: 'size-guide-1' }, { key: '_woodmart_360', value: 'on' }],
    raw: { id: 101, name: 'عبای محرم', meta_data: [{ key: '_woodmart_360', value: 'on' }] },
    ...overrides,
  };
}

function variation(): NormalizedVariation {
  return {
    externalId: '5001', sku: 'ABA-101-S1', priceMinor: 1850000, currency: 'IRT',
    stockStatus: 'instock', stockQty: 4, attributes: [{ name: 'pa_size', option: '1' }],
    meta: [{ key: '_wcos_pos_visible', value: 'yes' }], raw: { id: 5001 },
  };
}

function calls(): Array<{ sql: string; params: unknown[] }> {
  return mockedQuery.mock.calls.map((c) => ({ sql: c[0] as string, params: (c[1] as unknown[]) ?? [] }));
}

beforeEach(() => {
  mockedQuery.mockClear();
  mockedQuery.mockResolvedValue([{ id: 'prod-uuid' }] as never);
});

describe('upsertProductFull — scoping, idempotency, full preservation', () => {
  it('upserts the product scoped to site+tenant, idempotently, preserving meta + raw + permalink', async () => {
    await upsertProductFull(SITE_A, TENANT_A, product(), []);
    const insert = calls().find((c) => /INSERT INTO synced_product\b/.test(c.sql));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain('ON CONFLICT (site_id, external_id)');
    expect(insert!.params[0]).toBe(SITE_A);
    expect(insert!.params[1]).toBe(TENANT_A);
    expect(insert!.params[2]).toBe('101');
    expect(insert!.params[7]).toBe('https://shop.example/product/aba'); // permalink
    // meta + raw stored as JSON (lossless).
    expect(String(insert!.params[12])).toContain('_woodmart_360');
    expect(String(insert!.params[13])).toContain('meta_data');
  });

  it('replaces category/tag/brand links per product (scoped subselects)', async () => {
    await upsertProductFull(SITE_A, TENANT_A, product(), []);
    const c = calls();
    expect(c.find((x) => /DELETE FROM synced_product_category/.test(x.sql))).toBeDefined();
    expect(c.find((x) => /DELETE FROM synced_product_tag/.test(x.sql))).toBeDefined();
    expect(c.find((x) => /DELETE FROM synced_product_brand/.test(x.sql))).toBeDefined();
    const tagIns = c.find((x) => /INSERT INTO synced_product_tag/.test(x.sql));
    expect(tagIns!.sql).toContain('st.site_id = $3 AND st.external_id = $4');
    expect(tagIns!.params).toEqual(['prod-uuid', TENANT_A, SITE_A, '30']);
  });

  it('persists per-product attributes (pa_size) with options + variation flag, scoped', async () => {
    await upsertProductFull(SITE_A, TENANT_A, product(), []);
    expect(calls().find((x) => /DELETE FROM synced_product_attribute/.test(x.sql))).toBeDefined();
    const attrIns = calls().find((x) => /INSERT INTO synced_product_attribute/.test(x.sql));
    expect(attrIns).toBeDefined();
    expect(attrIns!.params[0]).toBe(TENANT_A);
    expect(attrIns!.params[1]).toBe(SITE_A);
    expect(attrIns!.params[4]).toBe('pa_size'); // name
    expect(String(attrIns!.params[6])).toContain('"1"'); // options json
    expect(attrIns!.params[7]).toBe(true); // is_variation
  });

  it('replaces images per product (delete-then-insert), scoped', async () => {
    await upsertProductFull(SITE_A, TENANT_A, product(), []);
    expect(calls().find((x) => /DELETE FROM synced_product_image/.test(x.sql))).toBeDefined();
    const imgInserts = calls().filter((x) => /INSERT INTO synced_product_image/.test(x.sql));
    expect(imgInserts).toHaveLength(2);
    expect(imgInserts[0].params[1]).toBe(SITE_A);
  });

  it('upserts variations with their meta, idempotently; none when not variable', async () => {
    await upsertProductFull(SITE_A, TENANT_A, product(), [variation()]);
    const vIns = calls().find((x) => /INSERT INTO synced_product_variant/.test(x.sql));
    expect(vIns).toBeDefined();
    expect(vIns!.sql).toContain('ON CONFLICT (site_id, external_id)');
    expect(vIns!.params[0]).toBe(TENANT_A);
    expect(vIns!.params[1]).toBe(SITE_A);
    expect(vIns!.params[3]).toBe('5001');
    expect(String(vIns!.params[10])).toContain('_wcos_pos_visible'); // variation meta preserved

    mockedQuery.mockClear();
    mockedQuery.mockResolvedValue([{ id: 'prod-uuid' }] as never);
    await upsertProductFull(SITE_A, TENANT_A, product({ type: 'simple' }), []);
    expect(calls().find((x) => /INSERT INTO synced_product_variant/.test(x.sql))).toBeUndefined();
  });
});
