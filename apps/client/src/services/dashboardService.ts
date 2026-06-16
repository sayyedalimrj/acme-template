/**
 * Dashboard service — thin wrapper over the active DashboardAdapter.
 *
 * Services are the only layer screens use for data (via query hooks); they never import
 * adapters into the UI. This keeps UI ⟂ data separation and makes the mock→http migration a
 * one-line change.
 */
import { getAdapters } from '@/adapters';
import type { DashboardOverview } from '@/domain/types';

export const dashboardService = {
  getOverview(): Promise<DashboardOverview> {
    return getAdapters().dashboard.getOverview();
  },
};
