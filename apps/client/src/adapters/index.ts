/**
 * Adapter factory.
 *
 * Resolves the concrete adapter set from `appConfig.dataSource`. MVP returns mock adapters.
 * The `http` branch is intentionally not implemented yet: real data flows through OUR
 * backend/proxy and is gated on the security review (see steering).
 *
 * The instance is cached so stateful mock adapters (auth/site) keep their in-memory state
 * across the app session. `resetAdaptersForTests` clears the cache so tests start isolated.
 */
import { isApiConfigured } from '@/config/api.config';
import { createHttpAdapters } from './http';
import { createMockAIAdvisorAdapter } from './mock/mockAIAdvisorAdapter';
import { createMockAuthAdapter } from './mock/mockAuthAdapter';
import { createMockBillingAdapter } from './mock/mockBillingAdapter';
import { createMockCustomerAdapter } from './mock/mockCustomerAdapter';
import { createMockCustomerIntelligenceAdapter } from './mock/mockCustomerIntelligenceAdapter';
import { createMockDashboardAdapter } from './mock/mockDashboardAdapter';
import { createMockMediaStudioAdapter } from './mock/mockMediaStudioAdapter';
import { createMockNotificationAutomationAdapter } from './mock/mockNotificationAutomationAdapter';
import { createMockOnboardingAdapter } from './mock/mockOnboardingAdapter';
import { createMockOrderAdapter } from './mock/mockOrderAdapter';
import { createMockProductAdapter } from './mock/mockProductAdapter';
import { createMockReportsAnalyticsAdapter } from './mock/mockReportsAnalyticsAdapter';
import { createMockSiteAdapter } from './mock/mockSiteAdapter';
import { resetActiveMockSiteId } from './mock/mockActiveSite';
import { createMockSupportAdapter } from './mock/mockSupportAdapter';
import { createMockSupportMessagingAdapter } from './mock/mockSupportMessagingAdapter';
import type { Adapters } from './types';

let cached: Adapters | null = null;

function createMockAdapters(): Adapters {
  return {
    auth: createMockAuthAdapter(),
    sites: createMockSiteAdapter(),
    dashboard: createMockDashboardAdapter(),
    products: createMockProductAdapter(),
    orders: createMockOrderAdapter(),
    customers: createMockCustomerAdapter(),
    onboarding: createMockOnboardingAdapter(),
    support: createMockSupportAdapter(),
    supportMessaging: createMockSupportMessagingAdapter(),
    billing: createMockBillingAdapter(),
    advisor: createMockAIAdvisorAdapter(),
    mediaStudio: createMockMediaStudioAdapter(),
    intelligence: createMockCustomerIntelligenceAdapter(),
    automation: createMockNotificationAutomationAdapter(),
    reports: createMockReportsAnalyticsAdapter(),
  };
}

function createAdapters(): Adapters {
  if (isApiConfigured()) {
    return createHttpAdapters();
  }
  return createMockAdapters();
}

export function getAdapters(): Adapters {
  if (!cached) {
    cached = createAdapters();
  }
  return cached;
}

/** Test-only: clear the cached adapter set so each test starts from fresh mock state. */
export function resetAdaptersForTests(): void {
  cached = null;
  resetActiveMockSiteId();
}

export type {
  Adapters,
  AuthAdapter,
  SiteAdapter,
  DashboardAdapter,
  ProductAdapter,
  OrderAdapter,
  CustomerAdapter,
  OnboardingAdapter,
  SupportAdapter,
  SupportMessagingAdapter,
  BillingAdapter,
  AIAdvisorAdapter,
  MediaStudioAdapter,
  CustomerIntelligenceAdapter,
  NotificationAutomationAdapter,
  ReportsAnalyticsAdapter,
} from './types';
