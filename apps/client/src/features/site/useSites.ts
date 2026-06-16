/**
 * Site hooks (TanStack Query).
 *
 * `useSites` lists connected sites; `useActiveSite` returns the active site; `useActiveSiteId`
 * is a convenience used by site-aware data hooks to build query keys.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys, siteService } from '@/services';
import type { SiteConnection } from '@/domain/types';

export function useSites(): UseQueryResult<SiteConnection[], Error> {
  return useQuery({
    queryKey: queryKeys.sites(),
    queryFn: () => siteService.listSites(),
  });
}

export function useActiveSite(): UseQueryResult<SiteConnection | null, Error> {
  return useQuery({
    queryKey: queryKeys.activeSite(),
    queryFn: () => siteService.getActiveSite(),
  });
}

/** Convenience: the active site id, or undefined while loading / when none is selected. */
export function useActiveSiteId(): string | undefined {
  const { data } = useActiveSite();
  return data?.id;
}
