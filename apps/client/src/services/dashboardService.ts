/**
 * Dashboard service.
 *
 * Thin wrapper over the active dashboard adapter. Services are the only layer screens use
 * for data (via query hooks); they never import adapters directly into the UI. This keeps
 * UI ⟂ data separation and makes the mock→http migration a one-line change.
 */
import { getAdapters } from '@/adapters';
import type { DashboardSummary } from '@/domain/types';

export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return getAdapters().dashboard.getSummary();
  },
};
