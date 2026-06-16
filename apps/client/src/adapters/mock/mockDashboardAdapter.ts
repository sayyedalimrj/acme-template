/**
 * Mock Dashboard adapter.
 *
 * Implements the DashboardAdapter against in-memory realistic data with a small simulated
 * latency so loading states are exercised in development. No network, no secrets.
 */
import { dashboardSummary } from '@/mock/data/dashboard';
import type { DashboardSummary } from '@/domain/types';

import type { DashboardAdapter } from '../types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockDashboardAdapter(): DashboardAdapter {
  return {
    async getSummary(): Promise<DashboardSummary> {
      await delay(450);
      // Return a defensive copy so callers cannot mutate the shared fixture.
      return JSON.parse(JSON.stringify(dashboardSummary)) as DashboardSummary;
    },
  };
}
