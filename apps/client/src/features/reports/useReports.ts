/**
 * Reports & Analytics data hooks (TanStack Query). Account-level (mock), period-scoped.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { isApiConfigured } from '@/config/api.config';
import { useActiveSite } from '@/features/site/useSites';
import { queryKeys, reportsAnalyticsService, type ReportsOverview } from '@/services';
import type { ReportPeriod } from '@/domain/types';

export function useReportsOverview(period: ReportPeriod): UseQueryResult<ReportsOverview, Error> {
  const { data: site } = useActiveSite();
  return useQuery({
    queryKey: [...queryKeys.reportsOverview(period), site?.id ?? 'none'],
    queryFn: () => reportsAnalyticsService.getOverview(period, site?.id),
    enabled: !isApiConfigured() || Boolean(site?.id),
  });
}
