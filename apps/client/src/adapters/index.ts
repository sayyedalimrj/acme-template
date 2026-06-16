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
import { appConfig } from '@/config/app.config';

import { createMockAuthAdapter } from './mock/mockAuthAdapter';
import { createMockCustomerAdapter } from './mock/mockCustomerAdapter';
import { createMockDashboardAdapter } from './mock/mockDashboardAdapter';
import { createMockOrderAdapter } from './mock/mockOrderAdapter';
import { createMockProductAdapter } from './mock/mockProductAdapter';
import { createMockSiteAdapter } from './mock/mockSiteAdapter';
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
  };
}

function createAdapters(): Adapters {
  switch (appConfig.dataSource) {
    case 'mock':
      return createMockAdapters();
    case 'http':
      throw new Error(
        'HTTP data source is not implemented in the MVP. Real data must flow through the ' +
          'backend/proxy and is gated on the security review.',
      );
    default:
      throw new Error(`Unknown data source: ${String(appConfig.dataSource)}`);
  }
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
}

export type {
  Adapters,
  AuthAdapter,
  SiteAdapter,
  DashboardAdapter,
  ProductAdapter,
  OrderAdapter,
  CustomerAdapter,
} from './types';
