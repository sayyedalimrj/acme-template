/**
 * Dora real-store sample validation (P5).
 *
 * Drives the WooCommerce client's product normalizer with a representative Dora payload — the
 * variable product «عبای محرم» with `pa_size` 1/2/3, a featured + gallery image, category «عمومی»,
 * a product_brand, sale/regular price, SKU, stock, weight/dimensions, descriptions, tags, and
 * Woodmart/size-guide/360/POS meta_data — and asserts:
 *   • UI/search fields are normalized (type, attributes, categories, images, price, stock…),
 *   • EVERYTHING is preserved in `raw` + `meta` (meta_data) — nothing is lost.
 */
jest.mock('../util/ssrf', () => ({
  assertSafeOutboundUrl: jest.fn().mockResolvedValue(undefined),
  safeFetch: jest.fn(),
}));

import { safeFetch } from '../util/ssrf';
import { getProduct } from '../services/woocommerce/wooClient';

const mockedFetch = safeFetch as jest.MockedFunction<typeof safeFetch>;

const DORA_PRODUCT = {
  id: 123,
  name: 'عبای محرم',
  slug: 'aba-moharram',
  permalink: 'https://dora.example/product/aba-moharram',
  type: 'variable',
  status: 'publish',
  sku: 'ABA-MOH',
  price: '1850000',
  regular_price: '2000000',
  sale_price: '1850000',
  stock_status: 'instock',
  stock_quantity: 9,
  manage_stock: true,
  weight: '0.8',
  dimensions: { length: '30', width: '20', height: '5' },
  short_description: 'عبای مناسب ایام محرم',
  description: 'توضیح کامل محصول',
  categories: [{ id: 7, name: 'عمومی', slug: 'general' }],
  tags: [{ id: 30, name: 'محرم', slug: 'moharram' }],
  brands: [{ id: 5, name: 'دورا', slug: 'dora' }],
  images: [
    { id: 900, src: 'https://dora.example/featured.jpg', alt: 'featured', position: 0 },
    { id: 901, src: 'https://dora.example/g1.jpg', alt: 'gallery1', position: 1 },
  ],
  attributes: [
    { id: 2, name: 'pa_size', slug: 'pa_size', position: 0, visible: true, variation: true, options: ['1', '2', '3'] },
  ],
  default_attributes: [{ id: 2, name: 'pa_size', option: '1' }],
  meta_data: [
    { id: 1, key: '_wcos_size_guide', value: 'size-guide-12' },
    { id: 2, key: '_woodmart_product_360', value: 'on' },
    { id: 3, key: '_wcos_pos_visibility', value: 'visible' },
    { id: 4, key: '_woodmart_custom_tab_title', value: 'راهنما' },
  ],
};

function wooResponse(json: unknown): unknown {
  return {
    ok: true,
    status: 200,
    headers: { get: () => '1' },
    json: async () => json,
  };
}

beforeEach(() => mockedFetch.mockReset());

describe('Dora sample — normalize + preserve', () => {
  it('normalizes UI/search fields for the variable عبای محرم product', async () => {
    mockedFetch.mockResolvedValue(wooResponse(DORA_PRODUCT) as never);
    const p = await getProduct(
      { storeUrl: 'https://dora.example', consumerKey: 'ck', consumerSecret: 'cs' },
      '123',
    );
    expect(p.type).toBe('variable');
    expect(p.permalink).toBe('https://dora.example/product/aba-moharram');
    expect(p.categories).toEqual([{ externalId: '7', name: 'عمومی' }]);
    expect(p.tags[0]).toMatchObject({ externalId: '30', name: 'محرم' });
    expect(p.brands[0]).toMatchObject({ externalId: '5', name: 'دورا' });
    expect(p.images.map((i) => i.src)).toEqual([
      'https://dora.example/featured.jpg',
      'https://dora.example/g1.jpg',
    ]);
    const size = p.productAttributes.find((a) => a.name === 'pa_size');
    expect(size).toBeDefined();
    expect(size!.isVariation).toBe(true);
    expect(size!.options).toEqual(['1', '2', '3']);
    expect(p.salePriceMinor).toBe(1850000);
    expect(p.regularPriceMinor).toBe(2000000);
  });

  it('preserves EVERYTHING (raw + meta) so nothing from WooCommerce is lost', async () => {
    mockedFetch.mockResolvedValue(wooResponse(DORA_PRODUCT) as never);
    const p = await getProduct(
      { storeUrl: 'https://dora.example', consumerKey: 'ck', consumerSecret: 'cs' },
      '123',
    );
    // The full raw payload is retained verbatim — weight/dimensions/descriptions/default_attributes too.
    expect(p.raw).toEqual(DORA_PRODUCT);
    // meta_data (size guide / 360 / POS visibility / custom tab) preserved as queryable meta.
    expect(p.meta).toEqual(DORA_PRODUCT.meta_data);
    const metaKeys = (p.meta as Array<{ key: string }>).map((m) => m.key);
    expect(metaKeys).toEqual(
      expect.arrayContaining(['_wcos_size_guide', '_woodmart_product_360', '_wcos_pos_visibility']),
    );
  });
});
