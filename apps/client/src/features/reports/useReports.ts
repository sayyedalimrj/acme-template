/**
 * Reports & Analytics data hooks (TanStack Query). Account-level (mock), period-scoped.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys, reportsAnalyticsService, type ReportsOverview } from '@/services';
import type { ReportPeriod } from '@/domain/types';

export function useReportsOverview(period: ReportPeriod): UseQueryResult<ReportsOverview, Error> {
  return useQuery({
    queryKey: queryKeys.reportsOverview(period),
    queryFn: () => reportsAnalyticsService.getOverview(period),
  });
}
