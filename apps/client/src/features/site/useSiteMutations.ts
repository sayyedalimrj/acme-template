/**
 * Site mutation hooks (TanStack Query), mock-only.
 *
 * Connect / set-active / disconnect against the mock SiteService. On success they invalidate
 * the sites list + the active site, and REMOVE all site-scoped data (`['site', ...]`) so the
 * shell and dashboard reload fresh for the new context with no cross-store stale data.
 *
 * Security: connect accepts only frontend-safe fields (name + URL). No credentials.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { queryKeys, siteService } from '@/services';
import type { ConnectSiteInput, SiteConnection } from '@/domain/types';

function useInvalidateSiteScopes(): () => Promise<void> {
  const queryClient = useQueryClient();
  return async () => {
    // REMOVE (not just invalidate) every site-scoped cache entry on a context change.
    //
    // Site-scoped keys are `['site', siteId, ...]`, but the http data adapters read the active
    // site id from a module-global holder. If we only *invalidated*, a still-cached query for the
    // previous site (`['site', A, 'products']`) could be refetched against the NEW active site and
    // store Store B's data under Store A's key — a cross-store leak. Removing the entries outright
    // guarantees the next read for each site fetches fresh under its own key, with no stale
    // Store A data ever shown after switching to Store B.
    queryClient.removeQueries({ queryKey: ['site'] });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sites() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activeSite() }),
    ]);
  };
}

export function useConnectSite(): UseMutationResult<SiteConnection, Error, ConnectSiteInput> {
  const invalidate = useInvalidateSiteScopes();
  return useMutation({
    mutationFn: (input: ConnectSiteInput) => siteService.connectMockSite(input),
    onSuccess: invalidate,
  });
}

export function useSetActiveSite(): UseMutationResult<SiteConnection, Error, string> {
  const invalidate = useInvalidateSiteScopes();
  return useMutation({
    mutationFn: (siteId: string) => siteService.setActiveSite(siteId),
    onSuccess: invalidate,
  });
}

export function useDisconnectSite(): UseMutationResult<void, Error, string> {
  const invalidate = useInvalidateSiteScopes();
  return useMutation({
    mutationFn: (siteId: string) => siteService.disconnectMockSite(siteId),
    onSuccess: invalidate,
  });
}
