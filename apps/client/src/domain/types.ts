/**
 * WooCommerce/WordPress-like commerce domain models (a pragmatic, production-minded subset).
 *
 * These mirror the shapes of the WooCommerce REST API so the UI behaves realistically and
 * so a future real adapter (backed by OUR backend/proxy) can map onto the same types with
 * minimal friction. Monetary values use decimal strings (WooCommerce convention) to avoid
 * floating-point drift.
 *
 * Commercial framing (see commercial-priorities.md): the shapes here intentionally support
 * operating-home dashboards, catalog/order depth, inventory & fulfillment awareness, action
 * items, and future roles/permissions — without implementing those features yet.
 *
 * IMPORTANT: none of these types carry credentials. Site connections hold frontend-safe
 * metadata only (see SiteConnection and the security steering).
 */

/** Monetary amount as a decimal string, e.g. "29.99" (WooCommerce convention). */
export type Money = string;

/** ISO-4217 currency code, e.g. "USD". Multi-currency readiness: entities carry currency. */
export type CurrencyCode = string;

/** ISO-8601 timestamp string. */
export type ISODate = string;

/** Generic paginated result returned by list adapters/services. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Catalog: products, categories, brands
// ---------------------------------------------------------------------------

export type ProductType = 'simple' | 'variable' | 'grouped' | 'external';
export type ProductStatus = 'publish' | 'draft' | 'pending' | 'private';
export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

/**
 * Future-facing bulk/tiered pricing (BigCommerce-like). Not populated heavily in the MVP;
 * present so catalog screens and a future adapter can carry it without a type change.
 */
export interface PriceTier {
  minQuantity: number;
  price: Money;
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
  currency: CurrencyCode;
  stockStatus: StockStatus;
  stockQuantity?: number;
  manageStock: boolean;
  categories: ProductCategory[];
  brand?: ProductBrand;
  images: ProductImage[];
  /** Lifetime units sold — useful for catalog insights and top-product widgets. */
  totalSales?: number;
  /** Future: tiered/bulk pricing. */
  priceTiers?: PriceTier[];
  dateCreated: ISODate;
  dateModified: ISODate;
}

// ---------------------------------------------------------------------------
// Orders, fulfillment & shipping
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

/** Operational fulfillment state, distinct from payment/order status. */
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

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

export interface ShippingSummary {
  method: string;
  status: FulfillmentStatus;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: ISODate;
  estimatedDelivery?: ISODate;
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
  fulfillment: FulfillmentStatus;
  currency: CurrencyCode;
  total: Money;
  subtotal: Money;
  totalTax: Money;
  shippingTotal: Money;
  discountTotal: Money;
  customerId?: string;
  billing: BillingAddress;
  lineItems: OrderLineItem[];
  shipping?: ShippingSummary;
  paymentMethodTitle: string;
  /** Applied coupon codes (discount depth). */
  couponCodes?: string[];
  statusHistory: OrderStatusHistoryEntry[];
  dateCreated: ISODate;
  dateModified: ISODate;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/** Compact order reference shown in a customer's history. */
export interface CustomerOrderSummary {
  orderId: string;
  number: string;
  status: OrderStatus;
  total: Money;
  currency: CurrencyCode;
  dateCreated: ISODate;
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
  currency: CurrencyCode;
  avatarUrl?: string;
  lastOrderDate?: ISODate;
  /** Recent orders for the customer detail view (mock-populated). */
  recentOrders?: CustomerOrderSummary[];
  dateCreated: ISODate;
}

// ---------------------------------------------------------------------------
// Sites (frontend-safe connection metadata only — NEVER credentials)
// ---------------------------------------------------------------------------

export type SiteStatus = 'connected' | 'disconnected' | 'pending' | 'error';

/**
 * Frontend-safe site connection metadata.
 * Deliberately contains NO consumer key/secret or application password fields. Real
 * credentials live only in the future backend/proxy (see security steering).
 */
export interface SiteConnection {
  id: string;
  name: string;
  url: string;
  status: SiteStatus;
  wooVersion?: string;
  wpVersion?: string;
  currency: CurrencyCode;
  timezone?: string;
  lastSyncedAt?: ISODate;
}

/** Input accepted by the (mock) connect-site flow. Intentionally has no secret fields. */
export interface ConnectSiteInput {
  name: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Auth / session (frontend-safe; no credentials)
// ---------------------------------------------------------------------------

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

/** Frontend-safe authenticated user profile. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Placeholder for future roles/permissions; not enforced yet. */
  role?: Role;
}

export interface AuthSession {
  status: AuthStatus;
  user: AuthUser | null;
}

// ---------------------------------------------------------------------------
// Roles & permissions (PLACEHOLDER for future team access — not enforced now)
// ---------------------------------------------------------------------------

export type Role = 'owner' | 'manager' | 'staff';

export type Permission =
  | 'dashboard:view'
  | 'products:view'
  | 'products:manage'
  | 'orders:view'
  | 'orders:manage'
  | 'customers:view'
  | 'settings:manage'
  | 'team:manage';

export interface RoleDefinition {
  role: Role;
  label: string;
  permissions: Permission[];
}

/** Future team member shape (Wix-like roles). Not implemented as a feature yet. */
export interface TeamMemberPlaceholder {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Alerts / action items (Shopify-like operating home, Squarespace-like alerts)
// ---------------------------------------------------------------------------

export type ActionItemType =
  | 'low_stock'
  | 'out_of_stock'
  | 'order_pending'
  | 'order_on_hold'
  | 'refund_requested'
  | 'abandoned_cart'
  | 'system';

export type ActionSeverity = 'info' | 'warning' | 'critical';

export interface ActionItem {
  id: string;
  type: ActionItemType;
  severity: ActionSeverity;
  title: string;
  message: string;
  date: ISODate;
  /** Optional reference to the entity the action concerns. */
  entity?: { kind: 'product' | 'order' | 'customer'; id: string; label?: string };
  /** Optional CTA label a future UI can render. */
  actionLabel?: string;
}

// ---------------------------------------------------------------------------
// Dashboard overview (operating home)
// ---------------------------------------------------------------------------

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

/** Counts of orders by fulfillment state — fulfillment awareness on the home screen. */
export interface FulfillmentCounts {
  unfulfilled: number;
  partial: number;
  fulfilled: number;
}

/** Lightweight abandoned-cart summary (Wix-like; future recovery workflows). */
export interface AbandonedCartSummary {
  count: number;
  recoverableValue: Money;
  currency: CurrencyCode;
}

export interface DashboardOverview {
  period: { from: ISODate; to: ISODate };
  currency: CurrencyCode;
  salesTotal: Money;
  ordersCount: number;
  productsCount: number;
  customersCount: number;
  /** Inventory awareness. */
  lowStockCount: number;
  outOfStockCount: number;
  /** Fulfillment awareness across open orders. */
  fulfillment: FulfillmentCounts;
  /** Urgent things needing attention (operating-home action items). */
  actionItems: ActionItem[];
  recentOrders: Order[];
  topProducts: TopProductEntry[];
  activity: ActivityEntry[];
  /** Analytics readiness (Wix-like). Optional, future-facing. */
  conversionRate?: number;
  abandonedCarts?: AbandonedCartSummary;
}

/**
 * Back-compat alias. The dashboard overview was previously named `DashboardSummary`.
 * Kept as an alias to avoid churn in any remaining references.
 */
export type DashboardSummary = DashboardOverview;

// ---------------------------------------------------------------------------
// List query parameter types (filters/pagination for future feature modules)
// ---------------------------------------------------------------------------

export interface ProductListQuery {
  search?: string;
  categoryId?: string;
  brandId?: string;
  stockStatus?: StockStatus;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
}

export interface OrderListQuery {
  search?: string;
  status?: OrderStatus;
  fulfillment?: FulfillmentStatus;
  customerId?: string;
  dateFrom?: ISODate;
  dateTo?: ISODate;
  page?: number;
  pageSize?: number;
}

export interface CustomerListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}
