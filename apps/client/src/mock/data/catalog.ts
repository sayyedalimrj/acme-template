/**
 * Mock catalog: categories, brands, and products.
 *
 * Demo data only — realistic commerce shapes (names, SKUs, regular/sale prices, stock
 * states, categories, brands, lifetime sales). No secrets; never sent to any network.
 */
import type { Product, ProductBrand, ProductCategory } from '@/domain/types';

const CURRENCY = 'USD';

export const categories: ProductCategory[] = [
  { id: 'cat_apparel', name: 'Apparel', slug: 'apparel' },
  { id: 'cat_outdoor', name: 'Outdoor', slug: 'outdoor' },
  { id: 'cat_home', name: 'Home & Living', slug: 'home-living' },
  { id: 'cat_accessories', name: 'Accessories', slug: 'accessories' },
  { id: 'cat_kitchen', name: 'Kitchen', slug: 'kitchen' },
];

export const brands: ProductBrand[] = [
  { id: 'brand_northwind', name: 'Northwind', slug: 'northwind' },
  { id: 'brand_lumen', name: 'Lumen', slug: 'lumen' },
  { id: 'brand_mesa', name: 'Mesa Goods', slug: 'mesa-goods' },
  { id: 'brand_trailhead', name: 'Trailhead', slug: 'trailhead' },
];

const categoryById = (id: string): ProductCategory => {
  const found = categories.find((c) => c.id === id);
  if (!found) throw new Error(`Mock category not found: ${id}`);
  return found;
};

const brandById = (id: string): ProductBrand | undefined => brands.find((b) => b.id === id);

export const products: Product[] = [
  {
    id: 'prod_1001',
    name: 'Aurora Cotton Crew Tee',
    slug: 'aurora-cotton-crew-tee',
    sku: 'APP-TEE-001',
    type: 'variable',
    status: 'publish',
    price: '24.00',
    regularPrice: '29.00',
    salePrice: '24.00',
    currency: CURRENCY,
    stockStatus: 'instock',
    stockQuantity: 142,
    manageStock: true,
    categories: [categoryById('cat_apparel')],
    brand: brandById('brand_northwind'),
    images: [{ id: 'img_1001', src: 'https://example.test/img/tee.jpg', alt: 'Cotton crew tee' }],
    totalSales: 154,
    dateCreated: '2025-02-11T09:14:00Z',
    dateModified: '2026-05-30T16:02:00Z',
  },
  {
    id: 'prod_1002',
    name: 'Trailhead Insulated Bottle 750ml',
    slug: 'trailhead-insulated-bottle-750ml',
    sku: 'OUT-BTL-750',
    type: 'simple',
    status: 'publish',
    price: '32.50',
    regularPrice: '32.50',
    currency: CURRENCY,
    stockStatus: 'instock',
    stockQuantity: 64,
    manageStock: true,
    categories: [categoryById('cat_outdoor')],
    brand: brandById('brand_trailhead'),
    images: [
      { id: 'img_1002', src: 'https://example.test/img/bottle.jpg', alt: 'Insulated bottle' },
    ],
    totalSales: 188,
    dateCreated: '2024-11-03T12:30:00Z',
    dateModified: '2026-06-02T08:45:00Z',
  },
  {
    id: 'prod_1003',
    name: 'Lumen Desk Lamp (Walnut)',
    slug: 'lumen-desk-lamp-walnut',
    sku: 'HOME-LMP-WAL',
    type: 'simple',
    status: 'publish',
    price: '78.00',
    regularPrice: '89.00',
    salePrice: '78.00',
    currency: CURRENCY,
    stockStatus: 'onbackorder',
    stockQuantity: 0,
    manageStock: true,
    categories: [categoryById('cat_home')],
    brand: brandById('brand_lumen'),
    images: [{ id: 'img_1003', src: 'https://example.test/img/lamp.jpg', alt: 'Walnut desk lamp' }],
    totalSales: 73,
    dateCreated: '2024-09-21T15:05:00Z',
    dateModified: '2026-05-28T11:20:00Z',
  },
  {
    id: 'prod_1004',
    name: 'Everyday Leather Cardholder',
    slug: 'everyday-leather-cardholder',
    sku: 'ACC-CARD-LTR',
    type: 'simple',
    status: 'publish',
    price: '19.99',
    regularPrice: '19.99',
    currency: CURRENCY,
    stockStatus: 'instock',
    stockQuantity: 230,
    manageStock: true,
    categories: [categoryById('cat_accessories')],
    brand: brandById('brand_northwind'),
    images: [
      { id: 'img_1004', src: 'https://example.test/img/cardholder.jpg', alt: 'Leather cardholder' },
    ],
    totalSales: 312,
    dateCreated: '2025-01-08T10:00:00Z',
    dateModified: '2026-06-10T09:10:00Z',
  },
  {
    id: 'prod_1005',
    name: 'Mesa Ceramic Pour-Over Set',
    slug: 'mesa-ceramic-pour-over-set',
    sku: 'KIT-POUR-CER',
    type: 'grouped',
    status: 'publish',
    price: '54.00',
    regularPrice: '54.00',
    currency: CURRENCY,
    stockStatus: 'outofstock',
    stockQuantity: 0,
    manageStock: true,
    categories: [categoryById('cat_kitchen')],
    brand: brandById('brand_mesa'),
    images: [
      {
        id: 'img_1005',
        src: 'https://example.test/img/pourover.jpg',
        alt: 'Ceramic pour-over set',
      },
    ],
    totalSales: 96,
    dateCreated: '2024-12-19T14:42:00Z',
    dateModified: '2026-06-08T13:33:00Z',
  },
  {
    id: 'prod_1006',
    name: 'Summit Merino Beanie',
    slug: 'summit-merino-beanie',
    sku: 'APP-BEA-MER',
    type: 'simple',
    status: 'publish',
    price: '26.00',
    regularPrice: '26.00',
    currency: CURRENCY,
    stockStatus: 'instock',
    stockQuantity: 9,
    manageStock: true,
    categories: [categoryById('cat_apparel')],
    brand: brandById('brand_trailhead'),
    images: [{ id: 'img_1006', src: 'https://example.test/img/beanie.jpg', alt: 'Merino beanie' }],
    totalSales: 121,
    dateCreated: '2025-03-02T11:00:00Z',
    dateModified: '2026-06-11T10:05:00Z',
  },
  {
    id: 'prod_1007',
    name: 'Lumen LED Floor Lamp',
    slug: 'lumen-led-floor-lamp',
    sku: 'HOME-LMP-FLR',
    type: 'simple',
    status: 'draft',
    price: '129.00',
    regularPrice: '129.00',
    currency: CURRENCY,
    stockStatus: 'instock',
    stockQuantity: 18,
    manageStock: true,
    categories: [categoryById('cat_home')],
    brand: brandById('brand_lumen'),
    images: [
      { id: 'img_1007', src: 'https://example.test/img/floorlamp.jpg', alt: 'LED floor lamp' },
    ],
    totalSales: 0,
    dateCreated: '2026-06-09T09:00:00Z',
    dateModified: '2026-06-12T09:00:00Z',
  },
  {
    id: 'prod_1008',
    name: 'Northwind Canvas Tote',
    slug: 'northwind-canvas-tote',
    sku: 'ACC-TOTE-CNV',
    type: 'simple',
    status: 'publish',
    price: '34.00',
    regularPrice: '40.00',
    salePrice: '34.00',
    currency: CURRENCY,
    stockStatus: 'instock',
    stockQuantity: 7,
    manageStock: true,
    categories: [categoryById('cat_accessories')],
    brand: brandById('brand_northwind'),
    images: [{ id: 'img_1008', src: 'https://example.test/img/tote.jpg', alt: 'Canvas tote' }],
    totalSales: 64,
    dateCreated: '2025-05-20T13:30:00Z',
    dateModified: '2026-06-13T15:00:00Z',
  },
];

export const productById = (id: string): Product => {
  const found = products.find((p) => p.id === id);
  if (!found) throw new Error(`Mock product not found: ${id}`);
  return found;
};
