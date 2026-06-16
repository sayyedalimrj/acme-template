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
  AuthSession,
  ConnectSiteInput,
  Customer,
  CustomerListQuery,
  DashboardOverview,
  Order,
  OrderListQuery,
  Paged,
  Product,
  ProductListQuery,
  SiteConnection,
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

/** The full set of adapters resolved from configuration. */
export interface Adapters {
  auth: AuthAdapter;
  sites: SiteAdapter;
  dashboard: DashboardAdapter;
  products: ProductAdapter;
  orders: OrderAdapter;
  customers: CustomerAdapter;
}
