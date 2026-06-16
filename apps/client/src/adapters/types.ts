/**
 * Adapter interfaces — the seam between the app and any data source.
 *
 * Screens never call these directly; they go through services + query hooks. The MVP wires
 * mock implementations. A future `http` implementation will target OUR backend/proxy with an
 * identical surface, so no screen code changes when real data arrives (design.md §5).
 *
 * Mutations are intentionally limited in this task to mock session/site state. Catalog/order
 * mutations (create/edit/delete, status updates) and any real store writes are gated on the
 * security review (see security steering).
 */
import type {
  AddInternalNoteInput,
  AuthSession,
  ConnectSiteInput,
  Customer,
  CustomerListQuery,
  DashboardOverview,
  ExistingOnboardingInput,
  ExistingSiteOnboardingRequest,
  NewLaunchInput,
  NewStoreLaunchRequest,
  OnboardingRequest,
  Order,
  OrderListQuery,
  Paged,
  Product,
  ProductListQuery,
  SiteConnection,
  StoreTemplate,
  SubscriptionPlan,
  SupportQueueItem,
  SupportRequestStatus,
} from '@/domain/types';

export interface AuthAdapter {
  /** Establish a mock authenticated session (no real credentials). */
  signInMock(input?: { email?: string; name?: string }): Promise<AuthSession>;
  /** Clear the session. */
  signOut(): Promise<AuthSession>;
  /** Read the current session (mock). */
  getSession(): Promise<AuthSession>;
}

export interface SiteAdapter {
  /** List connected sites (frontend-safe metadata only). */
  listSites(): Promise<SiteConnection[]>;
  /** The currently active site, or null when none is selected. */
  getActiveSite(): Promise<SiteConnection | null>;
  /** Set the active site by id; returns the new active site. */
  setActiveSite(siteId: string): Promise<SiteConnection>;
  /**
   * Connect a site in the mock layer. Accepts only non-secret metadata (name + URL).
   * Real credentials are never accepted here; production connection goes via backend/proxy.
   */
  connectMockSite(input: ConnectSiteInput): Promise<SiteConnection>;
  /** Disconnect/remove a site from the mock layer. */
  disconnectMockSite(siteId: string): Promise<void>;
}

export interface DashboardAdapter {
  /** Overview ("operating home") for the active site. */
  getOverview(): Promise<DashboardOverview>;
}

export interface ProductAdapter {
  listProducts(query?: ProductListQuery): Promise<Paged<Product>>;
  getProduct(id: string): Promise<Product>;
}

export interface OrderAdapter {
  listOrders(query?: OrderListQuery): Promise<Paged<Order>>;
  getOrder(id: string): Promise<Order>;
}

export interface CustomerAdapter {
  listCustomers(query?: CustomerListQuery): Promise<Paged<Customer>>;
  getCustomer(id: string): Promise<Customer>;
}

/**
 * Onboarding adapter — the seam for the "two front doors" onboarding platform (Phase 1).
 *
 * Mock-only: it lists the template catalog + plan placeholders, lists/reads onboarding
 * requests, and creates requests for both paths. It accepts ONLY frontend-safe input (no
 * credentials of any kind). Real provisioning/connection happens server-side later; a future
 * `http` implementation will target OUR backend/proxy with the same surface.
 */
export interface OnboardingAdapter {
  /** Prepared WordPress/WooCommerce store templates (mock catalog). */
  listTemplates(): Promise<StoreTemplate[]>;
  /** Subscription plan placeholders (no billing). */
  listPlans(): Promise<SubscriptionPlan[]>;
  /** All onboarding requests (both paths), newest first. */
  listRequests(): Promise<OnboardingRequest[]>;
  /** A single onboarding request by id. */
  getRequest(id: string): Promise<OnboardingRequest>;
  /** Create a Path A (existing-site) request. No credential fields are accepted. */
  createExistingSiteRequest(input: ExistingOnboardingInput): Promise<ExistingSiteOnboardingRequest>;
  /** Create a Path B (new-store launch) request. No credential fields are accepted. */
  createStoreLaunchRequest(input: NewLaunchInput): Promise<NewStoreLaunchRequest>;
}

/**
 * Support adapter — the seam for the internal support/operations queue (Phase 2).
 *
 * Mock-only and in-memory: it lists/reads queue items and performs staff actions (status
 * progression, assignment, checklist toggles, internal notes). All data is frontend-safe;
 * no method accepts or returns credentials. A future `apps/admin` + `apps/api` take over
 * this surface without UI rework. There is NO real provisioning, connection, or notification.
 */
export interface SupportAdapter {
  /** All support queue items, sorted by the adapter. */
  listSupportQueue(): Promise<SupportQueueItem[]>;
  /** A single queue item by id. */
  getSupportRequest(id: string): Promise<SupportQueueItem>;
  /** Move a request to a new status (mock-only; appends a timeline event). */
  updateSupportStatus(id: string, status: SupportRequestStatus): Promise<SupportQueueItem>;
  /** Assign/unassign a teammate (mock-only). Pass null to unassign. */
  assignSupportRequest(id: string, assigneeId: string | null): Promise<SupportQueueItem>;
  /** Toggle a checklist/playbook item (mock-only). */
  toggleChecklistItem(id: string, checklistItemId: string): Promise<SupportQueueItem>;
  /** Add a frontend-safe internal note (mock-only). */
  addInternalNote(id: string, input: AddInternalNoteInput): Promise<SupportQueueItem>;
}

/** The full set of adapters resolved from configuration. */
export interface Adapters {
  auth: AuthAdapter;
  sites: SiteAdapter;
  dashboard: DashboardAdapter;
  products: ProductAdapter;
  orders: OrderAdapter;
  customers: CustomerAdapter;
  onboarding: OnboardingAdapter;
  support: SupportAdapter;
}
