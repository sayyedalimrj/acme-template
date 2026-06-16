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
