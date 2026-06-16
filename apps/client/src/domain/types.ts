/**
 * WooCommerce/WordPress-like domain models (a pragmatic subset).
 *
 * These mirror the shapes of the WooCommerce REST API so the UI behaves realistically and
 * so a future real adapter can map onto the same types with minimal friction. Monetary
 * values use decimal strings (WooCommerce convention) to avoid floating-point drift.
 *
 * IMPORTANT: none of these types carry credentials. Site connections hold frontend-safe
 * metadata only (see SiteConnection and the security steering).
 */

/** Monetary amount as a decimal string, e.g. "29.99" (WooCommerce convention). */
export type Money = string;

/** ISO-8601 timestamp string. */
export type ISODate = string;

export type ProductType = 'simple' | 'variable' | 'grouped' | 'external';
export type ProductStatus = 'publish' | 'draft' | 'pending' | 'private';
export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  type: ProductType;
  status: ProductStatus;
  price: Money;
  regularPrice: Money;
  salePrice?: Money;
  stockStatus: StockStatus;
  stockQuantity?: number;
  manageStock: boolean;
  categories: ProductCategory[];
  images: ProductImage[];
  dateCreated: ISODate;
  dateModified: ISODate;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: Money;
  total: Money;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  date: ISODate;
  note?: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  currency: string;
  total: Money;
  subtotal: Money;
  totalTax: Money;
  shippingTotal: Money;
  discountTotal: Money;
  customerId?: string;
  billing: BillingAddress;
  lineItems: OrderLineItem[];
  paymentMethodTitle: string;
  statusHistory: OrderStatusHistoryEntry[];
  dateCreated: ISODate;
  dateModified: ISODate;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: 'customer' | 'subscriber';
  ordersCount: number;
  totalSpent: Money;
  avatarUrl?: string;
  dateCreated: ISODate;
}

/**
 * Frontend-safe site connection metadata.
 * Deliberately contains NO consumer key/secret or application password fields.
 */
export interface SiteConnection {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  wooVersion?: string;
  wpVersion?: string;
  currency: string;
  timezone?: string;
  lastSyncedAt?: ISODate;
}

export interface TopProductEntry {
  product: Product;
  unitsSold: number;
  revenue: Money;
}

export interface ActivityEntry {
  id: string;
  type: 'order' | 'product' | 'customer' | 'system';
  message: string;
  date: ISODate;
}

export interface DashboardSummary {
  period: { from: ISODate; to: ISODate };
  currency: string;
  salesTotal: Money;
  ordersCount: number;
  productsCount: number;
  customersCount: number;
  recentOrders: Order[];
  topProducts: TopProductEntry[];
  activity: ActivityEntry[];
}
