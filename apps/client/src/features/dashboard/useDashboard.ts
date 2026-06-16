/**
 * Dashboard data hook (TanStack Query).
 *
 * Provides loading/error/data state for the overview screen. Query keys are namespaced so
 * that a future active-site context can scope cache per site (design.md §4). For Task 1 a
 * single placeholder site id is used.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { dashboardService } from '@/services/dashboardService';
import type { DashboardSummary } from '@/domain/types';

// Placeholder active-site id until the active-site context lands in a later task.
const PLACEHOLDER_SITE_ID = 'site_demo';

export function dashboardQueryKey(siteId: string = PLACEHOLDER_SITE_ID): readonly unknown[] {
  return ['dashboard', siteId, 'summary'] as const;
}

export function useDashboard(): UseQueryResult<DashboardSummary, Error> {
  return useQuery({
    queryKey: dashboardQueryKey(),
    queryFn: () => dashboardService.getSummary(),
  });
}
