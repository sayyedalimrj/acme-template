/**
 * Dashboard data hook (TanStack Query).
 *
 * Site-aware: the query key is namespaced by the active site id. The query is disabled until
 * an active site is known so cache stays isolated per site.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useActiveSiteId } from '@/features/site/useSites';
import { dashboardService, queryKeys } from '@/services';
import type { DashboardOverview } from '@/domain/types';

export function useDashboard(): UseQueryResult<DashboardOverview, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.dashboard(siteId ?? 'none'),
    queryFn: () => dashboardService.getOverview(),
    enabled: Boolean(siteId),
  });
}
