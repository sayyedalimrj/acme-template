/**
 * HTTP adapter set — the production data source. Talks to OUR backend (`services/api`).
 *
 * Real backend-backed adapters: sites, products, orders, customers, dashboard. The remaining
 * adapters (onboarding, support, support messaging, billing display, and the AI/automation/
 * intelligence/media features) have no production backend yet and delegate to the in-memory
 * implementations — these are clearly isolated, non-critical, development-only surfaces. Auth is
 * handled separately by `authApi` + the session provider, not through the auth adapter.
 */
import { createMockAIAdvisorAdapter } from '../mock/mockAIAdvisorAdapter';
import { createMockAuthAdapter } from '../mock/mockAuthAdapter';
import { createMockBillingAdapter } from '../mock/mockBillingAdapter';
import { createMockCustomerIntelligenceAdapter } from '../mock/mockCustomerIntelligenceAdapter';
import { createMockMediaStudioAdapter } from '../mock/mockMediaStudioAdapter';
import { createMockNotificationAutomationAdapter } from '../mock/mockNotificationAutomationAdapter';
import { createMockOnboardingAdapter } from '../mock/mockOnboardingAdapter';
import { createMockReportsAnalyticsAdapter } from '../mock/mockReportsAnalyticsAdapter';
import { createMockSupportAdapter } from '../mock/mockSupportAdapter';
import { createMockSupportMessagingAdapter } from '../mock/mockSupportMessagingAdapter';
import type { Adapters } from '../types';
import { createHttpCustomerAdapter } from './httpCustomerAdapter';
import { createHttpDashboardAdapter } from './httpDashboardAdapter';
import { createHttpOrderAdapter } from './httpOrderAdapter';
import { createHttpProductAdapter } from './httpProductAdapter';
import { createHttpSiteAdapter } from './httpSiteAdapter';

export function createHttpAdapters(): Adapters {
  return {
    // Real backend-backed:
    sites: createHttpSiteAdapter(),
    products: createHttpProductAdapter(),
    orders: createHttpOrderAdapter(),
    customers: createHttpCustomerAdapter(),
    dashboard: createHttpDashboardAdapter(),
    // Not-yet-backed, development-only surfaces (delegated to in-memory implementations):
    auth: createMockAuthAdapter(),
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
