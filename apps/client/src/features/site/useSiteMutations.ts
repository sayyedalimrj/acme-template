/**
 * Site mutation hooks (TanStack Query), mock-only.
 *
 * Connect / set-active / disconnect against the mock SiteService. On success they invalidate
 * the sites list, the active site, and all site-scoped data (`['site', ...]`) so the shell
 * and dashboard reflect the new context immediately.
 *
 * Security: connect accepts only frontend-safe fields (name + URL). No credentials.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { queryKeys, siteService } from '@/services';
import type { ConnectSiteInput, SiteConnection } from '@/domain/types';

function useInvalidateSiteScopes(): () => Promise<void> {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sites() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activeSite() }),
      // All site-scoped data (dashboard/products/orders/customers) start with ['site', ...].
      queryClient.invalidateQueries({ queryKey: ['site'] }),
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
