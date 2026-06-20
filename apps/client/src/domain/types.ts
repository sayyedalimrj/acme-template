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
  /** Storefront URL (WooCommerce permalink), when synced. */
  permalink?: string;
  /** wp-admin product edit URL, for the "Open in WordPress" advanced-edit action. */
  adminEditUrl?: string;
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

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'access_denied';

/**
 * Which product experience ("portal") the signed-in person uses. One build ships three
 * role-based experiences that all share the same design system:
 *  - `merchant`  → the store-owner dashboard (the default app).
 *  - `admin`     → the platform owner's back-office (manage merchants, orders, marketers, payouts).
 *  - `affiliate` → the marketer/affiliate portal (referrals, commissions, payouts).
 *
 * The portal is chosen at (mock) sign-in and can be switched from each portal's "more" screen.
 * It is frontend-safe routing state only; real access control is enforced server-side later.
 */
export type AppPortal = 'merchant' | 'admin' | 'affiliate';

/** Frontend-safe authenticated user profile. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Mobile number (frontend-safe identifier; used as a display-name fallback). */
  mobile?: string;
  /** Optional profile photo (URL or data URI). Frontend-safe; never a credential. */
  avatarUrl?: string;
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
  /** Low/out-of-stock products for the inventory-alerts widget. */
  inventoryAlerts: Product[];
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

/**
 * Controlled product-update input (merchant edit). Only fields the backend can safely write to
 * WooCommerce are included. `regularPrice` is a major-unit number (e.g. 120000 Toman). Images are
 * intentionally NOT editable here yet (no binary upload path); category assignment uses synced
 * category ids.
 */
export interface ProductUpdateInput {
  name?: string;
  regularPrice?: number;
  status?: ProductStatus;
  stockQuantity?: number;
  stockStatus?: StockStatus;
  categoryIds?: string[];
}

/** Minimal, simple product creation (P2: no Woo complexity exposed). Status is REAL on save. */
export interface ProductCreateInput {
  name: string;
  sku?: string;
  regularPrice?: number;
  status?: ProductStatus;
  stockQuantity?: number;
  description?: string;
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

// ---------------------------------------------------------------------------
// Onboarding platform (Phase 1) — "two front doors" into the operating dashboard
//
// Two onboarding paths share one set of types:
//   A) Existing-site onboarding — connect a live store, or request managed handover.
//   B) New-store launch — we provision a WordPress/WooCommerce store, then connect it.
//
// SECURITY (binding — see security-model.md): onboarding records hold ONLY frontend-safe
// data (site URL, business info, brand assets, request status). They deliberately contain
// NO credentials of any kind — no WooCommerce keys/secrets, no WordPress application
// passwords, no admin logins. Real connection/provisioning happens server-side later
// (backend/proxy or companion plugin); the client only ever receives an opaque connection
// reference. None of the shapes below carry a credential field, and the mock layer rejects
// any attempt to add one.
// ---------------------------------------------------------------------------

/** Which front door a request came through. */
export type OnboardingType = 'existing' | 'new';

/** Subscription plan identifiers (UI placeholder — no billing is implemented). */
export type SubscriptionPlanId = 'starter' | 'growth' | 'pro' | 'managed';

/** Whether the merchant has a brand asset ready, or still needs to provide it. */
export type AssetReadiness = 'have' | 'need';

/**
 * Brand-asset checklist keys collected for a new-store launch. These describe what the
 * merchant can provide vs. what our team will help produce — no files are uploaded in this
 * mock (only readiness flags).
 */
export type BrandAssetKey =
  | 'logo'
  | 'product_photos'
  | 'product_list'
  | 'about_text'
  | 'contact_info'
  | 'shipping_payment';

/** A single brand-asset checklist item with its readiness flag (frontend-safe). */
export interface BrandAssetItem {
  key: BrandAssetKey;
  readiness: AssetReadiness;
}

// --- Path A: existing-site onboarding --------------------------------------

/** Merchant's confirmation of their current platform (non-secret). */
export type PlatformConfirmation = 'woocommerce' | 'not_sure' | 'other';

/**
 * What the merchant is asking for on an existing site.
 * `migration_consult` is documented for later and intentionally not offered in the first
 * mock UI, but modeled here so the adapter/support tooling can carry it without a type change.
 */
export type ExistingRequestType = 'connect_only' | 'managed_handover' | 'migration_consult';

/** Status flow for Path A (existing-site onboarding). */
export type ExistingOnboardingStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_customer_action'
  | 'connection_scheduled'
  | 'connected'
  | 'unsupported'
  | 'archived';

// --- Path B: new-store launch ----------------------------------------------

/** Status flow for Path B (new-store launch). */
export type NewLaunchStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'awaiting_assets'
  | 'provisioning'
  | 'ready_for_review'
  | 'connected'
  | 'delivered'
  | 'archived';

/** Union of every onboarding status across both paths. */
export type OnboardingStatus = ExistingOnboardingStatus | NewLaunchStatus;

/** One entry in a request's status timeline (status + when + optional note). */
export interface OnboardingStatusEvent {
  status: OnboardingStatus;
  date: ISODate;
  note?: string;
}

/** Fields common to both onboarding paths. Frontend-safe only — never credentials. */
interface OnboardingRequestBase {
  id: string;
  /** Discriminant. */
  type: OnboardingType;
  /** Business / brand name (frontend-safe). */
  businessName: string;
  /** Frontend-safe contact note (no credentials, ever). */
  contactNote?: string;
  /** Chronological status timeline (oldest → newest). */
  statusHistory: OnboardingStatusEvent[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Path A — existing WordPress/WooCommerce site onboarding request. */
export interface ExistingSiteOnboardingRequest extends OnboardingRequestBase {
  type: 'existing';
  /** Public store URL (non-secret domain). */
  siteUrl: string;
  /** Merchant's platform confirmation. */
  platform: PlatformConfirmation;
  /** What they're requesting. */
  requestType: ExistingRequestType;
  status: ExistingOnboardingStatus;
}

/** Path B — new managed store launch request. */
export interface NewStoreLaunchRequest extends OnboardingRequestBase {
  type: 'new';
  /** Desired or owned domain (non-secret). */
  domain: string;
  /** Business type / category. */
  businessType: string;
  /** Selected template from the catalog. */
  templateId: string;
  /** Selected plan (placeholder; no billing). */
  planId: SubscriptionPlanId;
  /** Brand-assets checklist with readiness flags. */
  brandAssets: BrandAssetItem[];
  /** Optional free-text brand color preference (frontend-safe; e.g. "سرمه‌ای و طلایی"). */
  brandColorPreference?: string;
  status: NewLaunchStatus;
}

/** A request from either onboarding path (discriminated by `type`). */
export type OnboardingRequest = ExistingSiteOnboardingRequest | NewStoreLaunchRequest;

/**
 * Input for submitting a Path A request. No credential fields exist or are accepted; the
 * mock adapter assigns id/status/timeline/timestamps.
 */
export interface ExistingOnboardingInput {
  businessName: string;
  siteUrl: string;
  platform: PlatformConfirmation;
  requestType: ExistingRequestType;
  contactNote?: string;
}

/**
 * Input for submitting a Path B request. No credential fields exist or are accepted; the
 * mock adapter assigns id/status/timeline/timestamps.
 */
export interface NewLaunchInput {
  businessName: string;
  domain: string;
  businessType: string;
  templateId: string;
  planId: SubscriptionPlanId;
  brandAssets: BrandAssetItem[];
  brandColorPreference?: string;
  contactNote?: string;
}

// --- Template catalog & subscription plans (mock) --------------------------

/** Availability of a template in the catalog. */
export type TemplateAvailability = 'available' | 'coming_soon';

/** A prepared WordPress/WooCommerce store template offered for new-store launches. */
export interface StoreTemplate {
  id: string;
  name: string;
  /** Human-readable business category (Persian), e.g. "پوشاک", "آرایشی و بهداشتی". */
  category: string;
  /** Short marketing description. */
  description: string;
  /** Who this template is best suited for. */
  recommendedFor: string;
  /** Selling points shown on the template card. */
  highlights: string[];
  /** Pages included out of the box (home, shop, product, blog, contact, …). */
  includedPages: string[];
  /** Human-readable estimated setup time, e.g. "۳ تا ۵ روز کاری". */
  setupTimeLabel: string;
  /** Optional minimum plan recommended to unlock this template. */
  requiredPlan?: SubscriptionPlanId;
  /**
   * Preview image placeholder label (no real asset bundled). A future adapter can replace
   * this with a real preview URL without a type change.
   */
  previewLabel: string;
  /** Optional accent tone used to tint the preview placeholder. */
  accent?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  /** Whether this template is featured/recommended. */
  recommended?: boolean;
  /** Catalog availability. */
  availability: TemplateAvailability;
}

/** A subscription plan shown during onboarding. Placeholder only — no billing/entitlements. */
export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  /** Display-only price label (e.g. "رایگان در دوره آزمایشی") — never a real charge. */
  priceLabel: string;
  /** Short tagline describing who the plan is for. */
  tagline: string;
  /** Feature highlights for the plan card / matrix. */
  features: string[];
  /** Whether managed store setup/support is included in this plan. */
  supportSetupIncluded: boolean;
  /** Whether the future AI advisor / SMS automation are part of this plan (later). */
  growthChannelsLater: boolean;
  /** Whether this plan is highlighted as the suggested choice. */
  recommended?: boolean;
}

// ---------------------------------------------------------------------------
// Support / internal operations queue (Phase 2)
//
// After merchants submit onboarding requests (Path A existing-site / Path B new-store),
// our internal support/operations team reviews, assigns, tracks, and progresses them. This
// models that queue as a serious internal workflow — but it is MOCK-ONLY and in-memory.
//
// SECURITY (binding — see security-model.md): support records hold ONLY frontend-safe data.
// They never contain credentials of any kind (no WordPress admin/application passwords, no
// WooCommerce consumer key/secret, no hosting/cPanel/FTP logins). The workflow explicitly
// reminds staff NOT to collect such secrets in-app; real connection/provisioning is handled
// later server-side (backend/proxy or companion plugin) or via an approved out-of-band
// process. A risk flag exists specifically to surface insecure-credential-sharing attempts.
// ---------------------------------------------------------------------------

/** Which onboarding path a support request originated from. */
export type SupportRequestType = OnboardingType;

/** Support request status — shares the onboarding status vocabulary across both paths. */
export type SupportRequestStatus = OnboardingStatus;

/** One entry in a support request's status timeline (reuses the onboarding event shape). */
export type SupportTimelineItem = OnboardingStatusEvent;

/** Operational priority of a queue item. */
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';

/** A teammate who can be assigned to a request (frontend-safe display data only). */
export interface SupportAssignee {
  id: string;
  name: string;
  /** Display-only role, e.g. "اتصال" / "راه‌اندازی". */
  role?: string;
}

/** A single playbook/checklist step for processing a request. */
export interface SupportChecklistItem {
  id: string;
  /** Persian, frontend-safe label (no secrets). */
  label: string;
  done: boolean;
}

/** A frontend-safe internal note left by a teammate (never contains secrets). */
export interface SupportInternalNote {
  id: string;
  /** Display name of the author (mock). */
  author: string;
  /** Frontend-safe note body. */
  body: string;
  createdAt: ISODate;
}

/** Who must act next on a request. */
export type SupportActionOwner = 'support' | 'customer';

/** The next concrete action for a request (frontend-safe summary + who owns it). */
export interface SupportNextAction {
  /** Persian, frontend-safe summary of the next step. */
  summary: string;
  owner: SupportActionOwner;
}

/**
 * Handoff/security risk flags surfaced on a request. `credentials_requested_externally`
 * specifically flags a request where insecure credential sharing was attempted — a reminder
 * that secrets must never be collected in-app.
 */
export type SupportHandoffRisk =
  | 'platform_unconfirmed'
  | 'awaiting_customer'
  | 'assets_incomplete'
  | 'domain_unverified'
  | 'credentials_requested_externally';

/** A request in the internal support operations queue (all fields frontend-safe). */
export interface SupportQueueItem {
  id: string;
  type: SupportRequestType;
  /** Merchant / store name. */
  storeName: string;
  /** Existing public site URL (Path A only). */
  siteUrl?: string;
  /** Desired/owned domain (Path B only). */
  domain?: string;
  /** Selected template id + display name (Path B only). */
  templateId?: string;
  templateName?: string;
  /** Selected plan id + display name. */
  planId?: SubscriptionPlanId;
  planName?: string;
  status: SupportRequestStatus;
  priority: SupportPriority;
  /** Assigned teammate, or null when unassigned. */
  assignee: SupportAssignee | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  nextAction: SupportNextAction;
  risks: SupportHandoffRisk[];
  checklist: SupportChecklistItem[];
  timeline: SupportTimelineItem[];
  notes: SupportInternalNote[];
}

/** Aggregate counts shown in the support queue summary cards. */
export interface SupportOperationsSummary {
  totalOpen: number;
  urgentOrHigh: number;
  awaitingCustomer: number;
  readyForReviewOrConnection: number;
}

/** Input for adding an internal note (frontend-safe; the adapter assigns id/author/date). */
export interface AddInternalNoteInput {
  body: string;
}

// ---------------------------------------------------------------------------
// Subscription / billing (Phase 3) — pricing & plan comparison (mock-only)
//
// Makes the business model visible inside the product: the four platform plans (Starter,
// Growth, Pro, Managed), what each includes, and how features will be gated later. This is
// MOCK-ONLY and FRONTEND-SAFE: prices are display-only labels (never a real charge), and
// there is NO payment-method data, NO card details, NO real billing IDs, and NO provider
// secrets. Real billing is a future backend + billing-provider concern (see security-model.md).
//
// Plan identity reuses the existing `SubscriptionPlan` / `SubscriptionPlanId` (also used by
// onboarding) so plan names/labels stay consistent across the product.
// ---------------------------------------------------------------------------

/** Billing cadence for the pricing toggle. */
export type BillingInterval = 'monthly' | 'yearly';

/** Grouping for the feature-comparison matrix. */
export type PlanFeatureCategory = 'core' | 'operations' | 'growth' | 'managed' | 'support';

/** How available a feature is on a given plan. */
export type PlanFeatureAvailability = 'included' | 'limited' | 'later' | 'none';

/** A single comparison-matrix feature with its availability per plan. */
export interface PlanFeature {
  id: string;
  category: PlanFeatureCategory;
  /** Persian, frontend-safe label. */
  label: string;
  availability: Record<SubscriptionPlanId, PlanFeatureAvailability>;
}

/** A display-only price for one plan + interval. Never a real charge. */
export interface PlanPrice {
  /** Display-only amount label, e.g. "۴۹۰٬۰۰۰ تومان" or "رایگان". */
  amountLabel: string;
  /** Display-only period label, e.g. "ماهانه" / "سالانه". */
  periodLabel: string;
  /** Optional secondary note (e.g. effective monthly on a yearly plan). */
  note?: string;
}

/** Per-plan pricing across both intervals (display-only). */
export interface PlanPricing {
  planId: SubscriptionPlanId;
  monthly: PlanPrice;
  yearly: PlanPrice;
  /** Optional yearly savings label, e.g. "۲ ماه رایگان". */
  savingsLabel?: string;
}

/** A single resolved entitlement for one plan (derived from PlanFeature for display). */
export interface PlanEntitlement {
  featureId: string;
  label: string;
  availability: PlanFeatureAvailability;
}

/** Lifecycle of the (mock) current subscription. */
export type SubscriptionStatus = 'trialing' | 'active';

/**
 * Summary of the merchant's current (mock) subscription. Frontend-safe only — no provider
 * customer/subscription IDs, no payment method, no card data.
 */
export interface CurrentSubscriptionSummary {
  planId: SubscriptionPlanId;
  planName: string;
  interval: BillingInterval;
  /** Display-only price label for the current plan/interval. */
  priceLabel: string;
  status: SubscriptionStatus;
  /** Frontend-safe renewal note (no real provider dates/ids). */
  renewalNote?: string;
}

/** The action a plan card offers relative to the current plan. */
export type PlanActionState =
  | 'current'
  | 'upgrade'
  | 'downgrade'
  | 'contact_support'
  | 'coming_soon';

/** Whether a real billing provider is wired (it is not — mock only). */
export type BillingProviderStatus = 'not_connected' | 'mock';

/** Result of previewing a plan change (mock-only; no charge is computed or made). */
export interface PlanChangePreview {
  fromPlanId: SubscriptionPlanId;
  toPlanId: SubscriptionPlanId;
  interval: BillingInterval;
  action: PlanActionState;
  /** Display-only target price label. */
  priceLabel: string;
  /** Frontend-safe, mock explanation of what would happen (no real billing). */
  note: string;
}

/** Acknowledgement of a mock plan-change request (no backend, no charge). */
export interface PlanChangeRequestResult {
  acknowledged: boolean;
  toPlanId: SubscriptionPlanId;
  interval: BillingInterval;
  /** Frontend-safe confirmation message. */
  message: string;
}

// ---------------------------------------------------------------------------
// AI Business Advisor (Phase 4) — mock-only commerce assistant
//
// Helps merchants understand and grow their store using existing mock store context. It
// produces insights + actionable recommendations (campaigns, product copy, restock,
// retention, SEO, pricing, media ideas) and a deterministic mock chat.
//
// SECURITY (binding — see security-model.md): this is a MOCK advisor. NO real AI provider is
// connected; NO external API is called; NO API keys / provider secrets / model config exist.
// Every suggestion is REVIEW-ONLY — nothing is published, no product/order is mutated, and no
// customer message is ever sent automatically. A future real provider must go through the
// backend/provider adapter with permission checks, audit logs, and explicit merchant approval.
// ---------------------------------------------------------------------------

/** Whether a real AI provider is wired (it is not — mock only). */
export type AIAdvisorProviderStatus = 'not_connected' | 'mock';

/** Priority of an insight/recommendation. */
export type AIAdvisorPriority = 'low' | 'medium' | 'high';

/** High-level grouping for recommendations on the screen. */
export type AIAdvisorCategory = 'sales' | 'inventory' | 'marketing' | 'content' | 'media';

/** The kind of recommendation produced by the advisor. */
export type AIAdvisorRecommendationType =
  | 'sales_insight'
  | 'product_copy'
  | 'campaign_idea'
  | 'restock_action'
  | 'customer_retention'
  | 'seo_suggestion'
  | 'pricing_suggestion'
  | 'inventory_warning'
  | 'support_followup'
  | 'media_studio_idea';

/** Review lifecycle of a recommendation (mock-only). */
export type AIAdvisorActionStatus = 'suggested' | 'reviewed' | 'dismissed';

/** A frontend-safe reference to a related entity, with an optional in-app link. */
export interface AIAdvisorRelatedEntity {
  kind: 'product' | 'order' | 'orders' | 'customer' | 'inventory';
  label: string;
  /** Optional in-app route for read-only navigation (no mutation). */
  href?: string;
}

/** A review-only action a recommendation can offer. */
export type AIAdvisorActionKind =
  | 'view_product'
  | 'view_orders'
  | 'view_inventory'
  | 'view_reports'
  | 'review_campaign'
  | 'draft_copy'
  | 'open_media_studio'
  | 'mark_reviewed'
  | 'dismiss';

/** A single suggested action button (review-only / mock). */
export interface AIAdvisorSuggestedAction {
  kind: AIAdvisorActionKind;
  /** Optional in-app route for navigable, read-only actions. */
  targetHref?: string;
}

/** A read-only insight about the store. */
export interface AIAdvisorInsight {
  id: string;
  /** Persian, frontend-safe. */
  title: string;
  summary: string;
  priority: AIAdvisorPriority;
  related?: AIAdvisorRelatedEntity;
  /** Suggested next step (Persian, frontend-safe). */
  suggestedStep: string;
}

/** An actionable, review-only recommendation. */
export interface AIAdvisorRecommendation {
  id: string;
  type: AIAdvisorRecommendationType;
  category: AIAdvisorCategory;
  /** Persian, frontend-safe. */
  title: string;
  summary: string;
  priority: AIAdvisorPriority;
  status: AIAdvisorActionStatus;
  related?: AIAdvisorRelatedEntity;
  /** Suggested next step (Persian, frontend-safe). */
  suggestedStep: string;
  /** Review-only action buttons. */
  actions: AIAdvisorSuggestedAction[];
}

/** A clickable prompt chip. */
export interface AIAdvisorPromptSuggestion {
  id: string;
  /** Persian prompt text. */
  text: string;
}

/** A single chat message in the mock conversation. */
export interface AIAdvisorConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Frontend-safe message text. */
  text: string;
  createdAt: ISODate;
}

/**
 * Lightweight, frontend-safe snapshot of the store used to ground the advisor. Built from
 * existing mock dashboard/subscription data — no customer PII, no secrets.
 */
export interface AIAdvisorStoreContextSummary {
  /** Display store name (mock). */
  storeName: string;
  currency: string;
  salesTotal: string;
  ordersCount: number;
  productsCount: number;
  customersCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  /** Orders still awaiting fulfillment. */
  fulfillmentPending: number;
  /** Top-selling product name (mock), if any. */
  topProductName?: string;
  /** Current subscription plan (for the advisor gating hint). */
  planId: SubscriptionPlanId;
  planName: string;
}

// ---------------------------------------------------------------------------
// AI Product Media Studio (Phase 4b) — mock-only product media workflow
//
// Helps merchants improve, repair, and generate product-media IDEAS from poor/low-quality
// source photos. It selects a product, analyzes a (simulated) source image, suggests fixes,
// and produces MOCK output-variant + promo-video concepts.
//
// SECURITY (binding — see security-model.md): MOCK-ONLY. NO real AI/image/video provider is
// connected, NO external API is called, NO file is uploaded or stored, NO product image is
// sent anywhere, and NO generated media is published or applied to products. There are NO
// provider keys / model IDs / file tokens / secrets. Outputs are placeholders. "Repair" is a
// suggested-improvement mock — it never claims exact restoration of badly damaged images. A
// future real provider must go through the backend/provider adapter with permission checks,
// audit logs, asset-ownership checks, and explicit merchant approval before publishing.
// ---------------------------------------------------------------------------

/** Whether a real media provider is wired (it is not — mock only). */
export type MediaStudioProviderStatus = 'not_connected' | 'mock';

/** Overall quality tier of a (simulated) source image. */
export type MediaStudioSourceQuality = 'poor' | 'fair' | 'good' | 'marketplace_ready';

/** A detected quality issue on a source image. */
export type MediaStudioQualityIssue =
  | 'low_resolution'
  | 'blurry'
  | 'bad_lighting'
  | 'noisy'
  | 'cluttered_background'
  | 'cropped_product'
  | 'damaged_or_dirty_product'
  | 'wrong_angle'
  | 'inconsistent_brand_style'
  | 'missing_transparency'
  | 'unknown';

/** Simulated source-photo scenario presets (no real upload). */
export type MediaStudioSourcePreset =
  | 'blurry'
  | 'cluttered_background'
  | 'low_light'
  | 'cropped_product'
  | 'damaged_or_dirty'
  | 'marketplace_ready';

/** A media generation/repair task the Studio can mock. */
export type MediaStudioTaskType =
  | 'improve_low_quality_photo'
  | 'repair_damaged_photo'
  | 'remove_background'
  | 'replace_background'
  | 'create_white_background'
  | 'create_lifestyle_image'
  | 'create_hero_banner'
  | 'create_social_ad_creative'
  | 'create_promo_video_concept'
  | 'create_product_storyboard'
  | 'resize_for_marketplace'
  | 'generate_alt_text';

/** Where a generated variant is best used. */
export type MediaStudioSuggestedUse =
  | 'product_gallery'
  | 'homepage_hero'
  | 'instagram_post'
  | 'story_reel'
  | 'marketplace_listing';

/** Review lifecycle of an output variant (mock-only). */
export type MediaStudioActionStatus = 'suggested' | 'reviewed' | 'approved' | 'dismissed';

/** Accent tone for placeholder preview blocks. */
export type MediaStudioTone = 'primary' | 'success' | 'warning' | 'info' | 'danger';

/**
 * A (simulated) source asset for a product plus its mock quality analysis. No real file is
 * uploaded or referenced — `preset` simulates a scenario and drives a deterministic analysis.
 */
export interface MediaStudioAsset {
  id: string;
  productId: string;
  preset: MediaStudioSourcePreset;
  /** Persian, frontend-safe label describing the simulated source. */
  label: string;
  quality: MediaStudioSourceQuality;
  /** Mock quality score 0–100. */
  qualityScore: number;
  issues: MediaStudioQualityIssue[];
  /** Tasks recommended to address the detected issues. */
  recommendedFixes: MediaStudioTaskType[];
  /** Frontend-safe note (suggested-improvement wording). */
  note: string;
}

/** A single mock output variant (placeholder — no real generated asset). */
export interface MediaStudioOutputVariant {
  id: string;
  productId: string;
  taskType: MediaStudioTaskType;
  /** Persian title/description, frontend-safe. */
  title: string;
  description: string;
  status: MediaStudioActionStatus;
  suggestedUse: MediaStudioSuggestedUse;
  /** Placeholder preview tone (no real image). */
  tone: MediaStudioTone;
  /** Honest limitations/warnings about the mock output. */
  limitations: string[];
}

/** Input for a mock generation request. */
export interface MediaStudioGenerationInput {
  productId: string;
  taskType: MediaStudioTaskType;
  preset?: MediaStudioSourcePreset;
  /** Optional prompt text (frontend-safe; never sent anywhere). */
  promptText?: string;
}

/** A mock generation request and its produced variants. */
export interface MediaStudioGenerationRequest {
  id: string;
  productId: string;
  taskType: MediaStudioTaskType;
  preset?: MediaStudioSourcePreset;
  promptText?: string;
  status: 'mock_completed';
  createdAt: ISODate;
  variants: MediaStudioOutputVariant[];
}

/** One scene in a mock storyboard. */
export interface MediaStudioStoryboardScene {
  order: number;
  /** Persian scene description. */
  description: string;
  durationLabel?: string;
}

/** A mock promo-video concept / storyboard. */
export interface MediaStudioVideoConcept {
  id: string;
  /** Persian title/goal, frontend-safe. */
  title: string;
  goal: string;
  scenes: MediaStudioStoryboardScene[];
  captionIdea: string;
  ctaIdea: string;
  /** Recommended channel, e.g. "اینستاگرام". */
  channel: string;
}

/** A clickable prompt chip. */
export interface MediaStudioPromptSuggestion {
  id: string;
  text: string;
}

/** A frontend-safe safety/handoff notice shown in the Studio. */
export interface MediaStudioSafetyNotice {
  id: string;
  severity: 'info' | 'warning';
  /** Persian, frontend-safe message. */
  message: string;
}

/** Input for analyzing a simulated source asset. */
export interface MediaStudioAnalyzeInput {
  productId: string;
  preset: MediaStudioSourcePreset;
}

// ---------------------------------------------------------------------------
// Customer Intelligence & Event Tracking (Phase 5) — mock-only model
//
// Prepares the platform for future search-behavior tracking, shopper analytics, SMS/
// back-in-stock automation, reports, and AI recommendations. This is a MOCK model only.
//
// SECURITY/PRIVACY (binding — see security-model.md): MOCK-ONLY. NO real tracking script,
// NO cookies, NO device fingerprinting, NO analytics provider (GA4/etc.), NO external send,
// NO real tracking/provider IDs, NO secrets. Actor references use only mock-safe customer
// labels or "anonymous" — no PII beyond existing mock data. Future real tracking must go
// through a backend event pipeline + consent model + audit logs + WordPress companion plugin,
// and any SMS/back-in-stock messaging requires explicit opt-in/opt-out.
// ---------------------------------------------------------------------------

/** Whether a real event/analytics provider is wired (it is not — mock only). */
export type EventProviderStatus = 'not_connected' | 'mock';

/** Readiness of a future tracking building block. */
export type EventReadinessState = 'not_connected' | 'planned' | 'mock';

/** Readiness snapshot for the future tracking stack. */
export interface EventTrackingReadiness {
  trackingProvider: EventReadinessState;
  wordpressPlugin: EventReadinessState;
  backendPipeline: EventReadinessState;
  consentModel: EventReadinessState;
  webhooks: EventReadinessState;
}

/** The taxonomy of commerce events. */
export type CommerceEventType =
  | 'site_search'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'abandoned_cart'
  | 'product_interest'
  | 'back_in_stock_subscribe'
  | 'sms_click'
  | 'campaign_click'
  | 'campaign_conversion'
  | 'product_restocked'
  | 'page_view'
  | 'unknown';

/** Where an event originated. */
export type CommerceEventSource =
  | 'storefront'
  | 'search'
  | 'cart'
  | 'checkout'
  | 'campaign'
  | 'sms'
  | 'system'
  | 'unknown';

/** A frontend-safe actor reference (mock customer or anonymous — never real PII). */
export interface CommerceEventActor {
  kind: 'customer' | 'anonymous';
  id?: string;
  /** Display label, e.g. a mock name or "خریدار ناشناس". */
  label: string;
}

/** A frontend-safe item/context attached to an event. */
export interface CommerceEventItem {
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  searchTerm?: string;
}

/** A single mock commerce event. */
export interface CommerceEvent {
  id: string;
  type: CommerceEventType;
  source: CommerceEventSource;
  actor: CommerceEventActor;
  item?: CommerceEventItem;
  createdAt: ISODate;
  /** Frontend-safe note. */
  note?: string;
}

/** Strength of a shopper's purchase intent. */
export type IntentStrength = 'high' | 'medium' | 'low';

/** A derived intent signal for a shopper. */
export interface CustomerIntentSignal {
  id: string;
  actorLabel: string;
  intent: IntentStrength;
  summary: string;
  suggestedAction: string;
}

/** The opportunity type a search term reveals. */
export type SearchOpportunity = 'add_product' | 'restock' | 'improve_naming' | 'campaign';

/** Insight derived from site-search demand. */
export interface SearchDemandInsight {
  id: string;
  term: string;
  count: number;
  /** Whether the term matched an existing product. */
  matched: boolean;
  matchedProductId?: string;
  matchedProductName?: string;
  opportunity: SearchOpportunity;
  suggestedAction: string;
}

/** Conversion temperature for a product's interest. */
export type ConversionSignal = 'hot' | 'warm' | 'cold';

/** Interest signals aggregated per product. */
export interface ProductInterestSignal {
  id: string;
  productId: string;
  productName: string;
  views: number;
  cartAdds: number;
  backInStockSubscribers: number;
  conversionSignal: ConversionSignal;
}

/** Back-in-stock interest for an out-of-stock / low-stock product. */
export interface BackInStockInterest {
  id: string;
  productId: string;
  productName: string;
  subscribers: number;
  /** Mock stock status label, e.g. "ناموجود". */
  stockStatus: string;
}

/** An abandoned-cart signal (mock; no real messaging). */
export interface AbandonedCartSignal {
  id: string;
  actor: CommerceEventActor;
  items: CommerceEventItem[];
  estimatedValue: string;
  currency: string;
  lastActivity: ISODate;
  recommendedFollowUp: string;
}

/** Conversion readiness of a campaign interaction. */
export type CampaignReadiness = 'ready' | 'warming' | 'low';

/** Campaign click/conversion signal (mock). */
export interface CampaignConversionSignal {
  id: string;
  campaign: string;
  clicks: number;
  conversions: number;
  readiness: CampaignReadiness;
}

/** Grouping for intelligence recommendations. */
export type IntelligenceRecommendationCategory =
  | 'search_demand'
  | 'restock'
  | 'abandoned_cart'
  | 'retention'
  | 'campaign'
  | 'content'
  | 'advisor';

/** An actionable, review-only intelligence recommendation. */
export interface IntelligenceRecommendation {
  id: string;
  category: IntelligenceRecommendationCategory;
  title: string;
  summary: string;
  priority: IntentStrength;
  status: 'suggested' | 'reviewed' | 'dismissed';
  suggestedStep: string;
  /** Optional in-app link for a read-only follow-up (e.g. /media-studio, /advisor). */
  href?: string;
}

/** Aggregate intelligence shown in the summary cards. */
export interface IntelligenceSummary {
  totalEvents: number;
  activeShoppers: number;
  interestedShoppers: number;
  topSearchTerms: { term: string; count: number }[];
  topViewedProducts: { productName: string; views: number }[];
  abandonedCarts: number;
  backInStockInterests: number;
  campaignInteractions: number;
  conversionReady: number;
}

/** Input for recording a mock event from the dev/mock panel. */
export interface RecordEventInput {
  type: CommerceEventType;
  productId?: string;
  searchTerm?: string;
}

// ---------------------------------------------------------------------------
// SMS & Back-in-stock automation (Phase 6) — mock-only
//
// Turns customer-interest signals (back-in-stock, abandoned cart, product interest, search
// demand) into REVIEW-ONLY automation/campaign drafts and SMS previews.
//
// SECURITY/PRIVACY (binding — see security-model.md): MOCK-ONLY. NO real SMS/email/WhatsApp
// provider, NO Kavenegar/Twilio/Klaviyo API, NO messages sent, NO real phone numbers (only
// masked placeholders like "09xx *** 1234"), NO sender IDs, NO provider keys, NO secrets, NO
// real consent/opt-out storage, NO scheduler. Future real sending must go through a backend/
// provider adapter with permission checks, an explicit consent model, opt-out handling, and
// audit logs. Marketing is never sent without consent.
// ---------------------------------------------------------------------------

/** Messaging channels (only SMS is modeled in the mock UI; others are future). */
export type NotificationChannel = 'sms' | 'email' | 'whatsapp';

/** Whether a real messaging provider is wired (it is not — mock only). */
export type NotificationProviderStatus = 'not_connected' | 'mock';

/** SMS provider options (only mock now; real ones are future). */
export type SmsProviderType = 'mock' | 'kavenegar_later' | 'twilio_later';

/** Readiness of a future provider/consent building block. */
export type ProviderReadinessState = 'not_connected' | 'planned' | 'mock' | 'later';

/** Consent state for a shopper/audience (no real consent is stored). */
export type ConsentStatus = 'opted_in' | 'pending' | 'not_collected';

/** Subscription/opt-out state. */
export type OptOutStatus = 'subscribed' | 'opted_out';

/** Review lifecycle of an automation/campaign draft (mock-only). */
export type AutomationActionStatus = 'suggested' | 'reviewed' | 'approved' | 'dismissed';

/** Conversion readiness of a campaign draft. */
export type CampaignConversionReadiness = 'ready' | 'warming' | 'low';

/** The kinds of automation rules / draft triggers. */
export type AutomationRuleType =
  | 'back_in_stock_alert'
  | 'low_stock_followup'
  | 'abandoned_cart_followup'
  | 'vip_customer_reactivation'
  | 'product_interest_followup'
  | 'search_demand_campaign'
  | 'restock_announcement'
  | 'manual_campaign_draft';

/** Provider/consent readiness snapshot shown in the status section. */
export interface NotificationReadiness {
  smsProvider: NotificationProviderStatus;
  kavenegar: ProviderReadinessState;
  twilio: ProviderReadinessState;
  email: ProviderReadinessState;
  consentModel: ProviderReadinessState;
  optOutHandling: ProviderReadinessState;
}

/** Frontend-safe consent readiness summary. */
export interface ConsentReadiness {
  consentModel: ProviderReadinessState;
  optOutHandling: ProviderReadinessState;
  /** Mock count of collected opt-ins. */
  collectedOptIns: number;
  /** Frontend-safe note. */
  note: string;
}

/** A back-in-stock interest subscription (mock; no real phone numbers). */
export interface BackInStockSubscription {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  /** Mock stock status label, e.g. "ناموجود". */
  stockStatus: string;
  interestedShoppers: number;
  consent: ConsentStatus;
  /** Masked example contact, e.g. "09xx *** 1234". Never a real number. */
  maskedExample: string;
  /** Suggested Persian message body. */
  suggestedMessage: string;
}

/** A campaign audience descriptor (mock sizes; no contact lists). */
export interface CampaignAudience {
  /** Persian label, e.g. "مشترکین موجودی محصول X". */
  label: string;
  size: number;
  channel: NotificationChannel;
  consentReadiness: ConsentStatus;
}

/** A deterministic SMS/message preview (no send). */
export interface CampaignMessagePreview {
  channel: NotificationChannel;
  /** Persian message body. */
  body: string;
  charCount: number;
  audienceSize: number;
  /** Opt-out footer placeholder (Persian). */
  optOutText: string;
  /** Consent warning shown when the audience isn't fully opted-in. */
  consentWarning: string;
}

/** A review-only automation/campaign draft. */
export interface CampaignDraft {
  id: string;
  ruleType: AutomationRuleType;
  /** Persian title/reason. */
  title: string;
  reason: string;
  channel: NotificationChannel;
  audience: CampaignAudience;
  /** Short Persian message preview shown on the card. */
  messagePreview: string;
  readiness: CampaignConversionReadiness;
  status: AutomationActionStatus;
}

/** Alias: a draft is the unit of automation output. */
export type AutomationDraft = CampaignDraft;

/** Status of an automation rule (mock / planned only — never actively running). */
export type AutomationRuleStatus = 'mock' | 'planned';

/** A configured automation rule (mock; never executes). */
export interface AutomationRule {
  id: string;
  ruleType: AutomationRuleType;
  /** Persian trigger description. */
  trigger: string;
  audience: string;
  channel: NotificationChannel;
  status: AutomationRuleStatus;
  /** Persian next step. */
  nextStep: string;
  /** What real provider/capability is required before this can run. */
  providerRequirement: string;
}

/** A frontend-safe safety/consent notice shown in the automation screen. */
export interface AutomationSafetyNotice {
  id: string;
  severity: 'info' | 'warning';
  /** Persian, frontend-safe message. */
  message: string;
}

// ---------------------------------------------------------------------------
// Reports & Analytics (Phase 7) — lightweight, mock-only business reporting
//
// Gives merchants a clear business view (sales, product performance, customers,
// inventory, search demand, campaign readiness, a conversion funnel, and an executive
// summary) built from the existing mock data. It prepares the platform for future real
// analytics without committing to any provider.
//
// SECURITY/PRIVACY (binding — see security-model.md): MOCK-ONLY. NO real analytics provider,
// NO GA4, NO WooCommerce Reports API, NO tracking script/cookies/fingerprints, NO external
// send, NO real analytics/provider IDs, NO API keys, NO secrets, NO real date-filtering
// engine, and NO report export/download. Customer references reuse only mock-safe labels —
// no extra PII. Future real reporting must go through a backend/event pipeline, a consent/
// privacy model, and the WordPress/WooCommerce integration.
// ---------------------------------------------------------------------------

/** Reporting period options. `custom_later` is a placeholder — no real date engine exists. */
export type ReportPeriod = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom_later';

/** Direction of a metric trend. */
export type MetricTrend = 'up' | 'down' | 'flat';

/** Whether a real analytics provider is wired (it is not — mock only). */
export type AnalyticsProviderStatus = 'not_connected' | 'mock';

/** Readiness of a future analytics/reporting building block. */
export type ReportReadinessState = 'not_connected' | 'planned' | 'mock' | 'later';

/** Whether report export/download is available (it is not — planned/mock only). */
export type ReportExportStatus = 'not_available' | 'planned' | 'mock';

/** Readiness snapshot for the future analytics/reporting stack. */
export interface AnalyticsReadiness {
  analyticsProvider: AnalyticsProviderStatus;
  wooCommerceReports: ReportReadinessState;
  ga4: ReportReadinessState;
  backendPipeline: ReportReadinessState;
  webhooks: ReportReadinessState;
  export: ReportExportStatus;
}

/** A single KPI metric with a trend, ready to render as a card. */
export interface ReportMetric {
  /** Stable id, e.g. 'gross_sales'. */
  id: string;
  /** Persian, frontend-safe label. */
  label: string;
  /** Display value (already formatted; currency/number/string). */
  value: string;
  trend: MetricTrend;
  /** Optional Persian change label, e.g. "+۱۲٪". */
  changeLabel?: string;
}

/** Executive summary — the headline KPIs across the store for a period. */
export interface ExecutiveSummary {
  period: ReportPeriod;
  currency: CurrencyCode;
  grossSales: Money;
  ordersCount: number;
  averageOrderValue: Money;
  topProductName?: string;
  returningCustomers: number;
  lowStockCount: number;
  outOfStockCount: number;
  campaignReadyAudiences: number;
  searchOpportunities: number;
  /** KPI cards (with trend) ready for the executive-summary grid. */
  metrics: ReportMetric[];
}

/** One point on the lightweight (non-charted) sales trend. */
export interface SalesTrendPoint {
  /** Persian label, e.g. a weekday or short date. */
  label: string;
  value: Money;
}

/** Revenue + order count for a single order status. */
export interface SalesByStatusEntry {
  status: OrderStatus;
  orders: number;
  revenue: Money;
}

/** Sales report — totals, trend, best day, and a status breakdown. */
export interface SalesReport {
  period: ReportPeriod;
  currency: CurrencyCode;
  totalSales: Money;
  ordersCount: number;
  averageOrderValue: Money;
  trend: MetricTrend;
  /** Optional Persian change label vs. the previous period. */
  changeLabel?: string;
  /** Best sales day (Persian label) + its sales, if modeled. */
  bestDayLabel?: string;
  bestDaySales?: Money;
  /** Lightweight trend rows rendered as progress bars (no chart library). */
  trendPoints: SalesTrendPoint[];
  byStatus: SalesByStatusEntry[];
}

/** Stock-risk tier for a product in the performance report. */
export type ProductStockRisk = 'none' | 'low' | 'out';

/** A single product row in the performance report. */
export interface ProductPerformanceEntry {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: Money;
  /** Share of total reported revenue (0–100). */
  revenueSharePercent: number;
  stockRisk: ProductStockRisk;
  /** Optional in-app link to the product detail (read-only). */
  href?: string;
}

/** Product performance report — top, low-performing, and stock-risk products. */
export interface ProductPerformanceReport {
  period: ReportPeriod;
  currency: CurrencyCode;
  topProducts: ProductPerformanceEntry[];
  lowPerformers: ProductPerformanceEntry[];
  stockRisk: ProductPerformanceEntry[];
}

/** Customer report — totals, repeat/VIP/inactive counts, and a retention note. */
export interface CustomerReport {
  period: ReportPeriod;
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  vipCustomers: number;
  inactiveCustomers: number;
  /** Repeat purchase rate (0–100). */
  repeatRatePercent: number;
  /** Persian, frontend-safe retention-opportunity note. */
  retentionOpportunity: string;
}

/** Priority of a restock action in the inventory report. */
export type RestockPriority = 'high' | 'medium' | 'low';

/** A single restock-priority row in the inventory report. */
export interface InventoryRestockEntry {
  productId: string;
  productName: string;
  sku: string;
  /** Persian stock-status label, e.g. "ناموجود". */
  stockStatus: string;
  priority: RestockPriority;
  /** Optional in-app link to the product detail (read-only). */
  href?: string;
}

/** Inventory / stock report — counts + restock priorities. */
export interface InventoryReport {
  period: ReportPeriod;
  lowStock: number;
  outOfStock: number;
  backorder: number;
  restockPriority: InventoryRestockEntry[];
}

/**
 * Search demand report — reuses the intelligence `SearchDemandInsight` shape, split into
 * top terms, no-match searches (unmet demand), and restock-related searches.
 */
export interface SearchDemandReport {
  period: ReportPeriod;
  topTerms: SearchDemandInsight[];
  noMatchTerms: SearchDemandInsight[];
  restockTerms: SearchDemandInsight[];
}

/** The kind of audience a campaign-readiness row targets. */
export type CampaignAudienceKind =
  | 'back_in_stock'
  | 'abandoned_cart'
  | 'vip_reactivation'
  | 'search_demand'
  | 'product_interest';

/** A single campaign-ready audience row (mock sizes; no contact lists). */
export interface CampaignReadinessAudience {
  id: string;
  kind: CampaignAudienceKind;
  /** Persian, frontend-safe label. */
  label: string;
  size: number;
  consent: ConsentStatus;
  readiness: CampaignConversionReadiness;
}

/** Campaign / SMS readiness report — audiences + consent + drafts ready for review. */
export interface CampaignReadinessReport {
  period: ReportPeriod;
  backInStockAudiences: number;
  abandonedCartCandidates: number;
  vipReactivationCandidates: number;
  /** Consent readiness (planned — no real consent is stored). */
  consentReadiness: ReportReadinessState;
  draftsReadyForReview: number;
  audiences: CampaignReadinessAudience[];
}

/** A step in the conversion funnel. */
export type FunnelStepKind =
  | 'product_views'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'abandoned_cart';

/** A single funnel step with a mock count and a conversion percentage. */
export interface FunnelStep {
  step: FunnelStepKind;
  /** Persian, frontend-safe label. */
  label: string;
  count: number;
  /** Percentage relative to the top step (0–100). */
  conversionPercent: number;
}

/** Conversion funnel report (mock counts; rendered with progress rows, no chart library). */
export interface ConversionFunnelReport {
  period: ReportPeriod;
  steps: FunnelStep[];
  /** Overall views→purchase conversion (0–100). */
  overallConversionPercent: number;
  abandonedCartCount: number;
}

/** Grouping for a report insight. */
export type ReportInsightCategory =
  | 'sales'
  | 'product'
  | 'customer'
  | 'inventory'
  | 'search'
  | 'campaign'
  | 'funnel';

/** A read-only insight surfaced from the reports. */
export interface ReportInsight {
  id: string;
  category: ReportInsightCategory;
  /** Persian, frontend-safe. */
  title: string;
  summary: string;
  trend?: MetricTrend;
}

/** The kind of action a report recommendation suggests. */
export type ReportRecommendationType =
  | 'restock'
  | 'run_campaign'
  | 'rewrite_copy'
  | 'review_abandoned'
  | 'improve_media'
  | 'prioritize_fulfillment';

/** An actionable, review-only report recommendation. */
export interface ReportRecommendation {
  id: string;
  type: ReportRecommendationType;
  /** Persian, frontend-safe. */
  title: string;
  summary: string;
  priority: IntentStrength;
  /** Persian suggested next step. */
  suggestedStep: string;
  /** Optional in-app link for a read-only follow-up (e.g. /inventory, /automations). */
  href?: string;
}

// ---------------------------------------------------------------------------
// Customer support messaging (client ↔ support team)
//
// The merchant-facing chat thread. Frontend-safe only. This intentionally mirrors the admin
// support-inbox author model (`customer | agent | system`) so a future backend can bridge the
// same conversation between the client app and the internal admin inbox (`apps/admin`) without
// a UI rewrite: the client posts customer messages and reads agent/system replies through the
// `SupportMessagingAdapter`, the backend persists them in the shared support tables, and the
// admin inbox reads/replies on the other side. MOCK-ONLY for now (no backend, nothing sent).
// ---------------------------------------------------------------------------

/** Who authored a support chat message. Mirrors the admin inbox author model. */
export type SupportChatAuthor = 'customer' | 'agent' | 'system';

/** A single message in the merchant-facing support conversation (frontend-safe). */
export interface SupportChatMessage {
  id: string;
  author: SupportChatAuthor;
  /** Frontend-safe message text (never secrets/credentials). */
  body: string;
  createdAt: ISODate;
  /** Optional display label for the author (e.g. the support agent name). */
  authorLabel?: string;
}

/** Lifecycle of a merchant support conversation. */
export type SupportConversationStatus = 'open' | 'waiting_support' | 'resolved';

/** The merchant-facing support conversation thread. */
export interface SupportConversation {
  id: string;
  /** Short subject/topic (frontend-safe). */
  subject: string;
  status: SupportConversationStatus;
  messages: SupportChatMessage[];
}
