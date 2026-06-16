/**
 * Centralized, typed TanStack Query keys.
 *
 * Keys for store data are SITE-AWARE: they are namespaced by the active site id so switching
 * sites isolates cache and never bleeds one store's data into another (design.md §4/§8).
 * Global keys (session, sites list) are not site-scoped.
 *
 * Keep all key construction here so invalidation and prefetching stay consistent.
 */
import type { CustomerListQuery, OrderListQuery, ProductListQuery } from '@/domain/types';

export const queryKeys = {
  /** Current auth session (global). */
  session: () => ['session'] as const,

  /** All connected sites (global). */
  sites: () => ['sites'] as const,
  /** The active site (global). */
  activeSite: () => ['sites', 'active'] as const,

  /** Operating-home overview for a site. */
  dashboard: (siteId: string) => ['site', siteId, 'dashboard'] as const,

  /** Products list (optionally filtered) for a site. */
  products: (siteId: string, query?: ProductListQuery) =>
    ['site', siteId, 'products', query ?? {}] as const,
  /** Single product for a site. */
  product: (siteId: string, productId: string) => ['site', siteId, 'product', productId] as const,

  /** Orders list (optionally filtered) for a site. */
  orders: (siteId: string, query?: OrderListQuery) =>
    ['site', siteId, 'orders', query ?? {}] as const,
  /** Single order for a site. */
  order: (siteId: string, orderId: string) => ['site', siteId, 'order', orderId] as const,

  /** Customers list (optionally filtered) for a site. */
  customers: (siteId: string, query?: CustomerListQuery) =>
    ['site', siteId, 'customers', query ?? {}] as const,
  /** Single customer for a site. */
  customer: (siteId: string, customerId: string) =>
    ['site', siteId, 'customer', customerId] as const,

  // Onboarding is account-level (pre-/cross-site), so these keys are global, not site-scoped.
  /** Store template catalog (mock). */
  onboardingTemplates: () => ['onboarding', 'templates'] as const,
  /** Subscription plan placeholders. */
  onboardingPlans: () => ['onboarding', 'plans'] as const,
  /** All onboarding requests (both paths). */
  onboardingRequests: () => ['onboarding', 'requests'] as const,
  /** A single onboarding request. */
  onboardingRequest: (id: string) => ['onboarding', 'request', id] as const,

  // Support operations is internal/account-level, so these keys are global, not site-scoped.
  /** All support queue items. */
  supportQueue: () => ['support', 'queue'] as const,
  /** A single support request. */
  supportRequest: (id: string) => ['support', 'request', id] as const,

  // Subscription/billing is account-level (mock), so these keys are global, not site-scoped.
  /** Everything the plans screen needs (plans + pricing + features + current + provider). */
  subscriptionOverview: () => ['subscription', 'overview'] as const,
} as const;
