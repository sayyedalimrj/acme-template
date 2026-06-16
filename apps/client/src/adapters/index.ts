/**
 * Adapter factory.
 *
 * Resolves the concrete adapter set from `appConfig.dataSource`. MVP returns mock adapters.
 * The `http` branch is intentionally not implemented yet: real data flows through OUR
 * backend/proxy and is gated on the security review (see steering).
 */
import { appConfig } from '@/config/app.config';

import { createMockDashboardAdapter } from './mock/mockDashboardAdapter';
import type { Adapters } from './types';

let cached: Adapters | null = null;

function createAdapters(): Adapters {
  switch (appConfig.dataSource) {
    case 'mock':
      return {
        dashboard: createMockDashboardAdapter(),
      };
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

export type { Adapters } from './types';
export type { DashboardAdapter } from './types';
