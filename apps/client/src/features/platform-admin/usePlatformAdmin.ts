/**
 * Platform Admin data hooks (TanStack Query).
 *
 * Internal/account-level (not site-scoped). Back the platform overview and the customer/
 * tenant detail screens. All data is mock + frontend-safe (see security-model.md).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { platformAdminService, queryKeys } from '@/services';
import type {
  PlatformAdminOverview,
  PlatformAdminTask,
  PlatformSecuritySignal,
  PlatformSiteSummary,
  PlatformTenant,
  PlatformUsageSummary,
} from '@/domain/types';

export function usePlatformOverview(): UseQueryResult<PlatformAdminOverview, Error> {
  return useQuery({
    queryKey: queryKeys.platformOverview(),
    queryFn: () => platformAdminService.getPlatformOverview(),
  });
}

export function usePlatformTenants(): UseQueryResult<PlatformTenant[], Error> {
  return useQuery({
    queryKey: queryKeys.platformTenants(),
    queryFn: () => platformAdminService.listPlatformTenants(),
  });
}

export function usePlatformTenant(id: string): UseQueryResult<PlatformTenant, Error> {
  return useQuery({
    queryKey: queryKeys.platformTenant(id),
    queryFn: () => platformAdminService.getPlatformTenant(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function usePlatformSites(): UseQueryResult<PlatformSiteSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.platformSites(),
    queryFn: () => platformAdminService.listPlatformSites(),
  });
}

export function usePlatformSecuritySignals(): UseQueryResult<PlatformSecuritySignal[], Error> {
  return useQuery({
    queryKey: queryKeys.platformSecuritySignals(),
    queryFn: () => platformAdminService.listPlatformSecuritySignals(),
  });
}

export function usePlatformAdminTasks(): UseQueryResult<PlatformAdminTask[], Error> {
  return useQuery({
    queryKey: queryKeys.platformAdminTasks(),
    queryFn: () => platformAdminService.listPlatformAdminTasks(),
  });
}

export function usePlatformUsage(): UseQueryResult<PlatformUsageSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.platformUsage(),
    queryFn: () => platformAdminService.listPlatformUsageSummaries(),
  });
}
