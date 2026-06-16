/**
 * Support data hooks (TanStack Query).
 *
 * Support operations is internal/account-level, so these queries are NOT site-scoped. They
 * back the support queue list and the request detail/review screen.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys, supportService } from '@/services';
import type { SupportQueueItem } from '@/domain/types';

export function useSupportQueue(): UseQueryResult<SupportQueueItem[], Error> {
  return useQuery({
    queryKey: queryKeys.supportQueue(),
    queryFn: () => supportService.listSupportQueue(),
  });
}

export function useSupportRequest(id: string): UseQueryResult<SupportQueueItem, Error> {
  return useQuery({
    queryKey: queryKeys.supportRequest(id),
    queryFn: () => supportService.getSupportRequest(id),
    enabled: Boolean(id),
  });
}
