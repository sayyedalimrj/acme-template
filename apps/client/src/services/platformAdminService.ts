/**
 * Platform Admin service — thin wrapper over the active PlatformAdminAdapter.
 *
 * Powers OUR internal control-layer screens (overview + customer/tenant detail). Handles
 * only frontend-safe data; never credentials/secrets (see security-model.md). Screens/hooks
 * call this, never the adapter directly.
 */
import { getAdapters } from '@/adapters';
import type {
  PlatformAdminOverview,
  PlatformAdminTask,
  PlatformSecuritySignal,
  PlatformSiteSummary,
  PlatformTenant,
  PlatformUsageSummary,
} from '@/domain/types';

export const platformAdminService = {
  getPlatformOverview(): Promise<PlatformAdminOverview> {
    return getAdapters().platformAdmin.getPlatformOverview();
  },
  listPlatformTenants(): Promise<PlatformTenant[]> {
    return getAdapters().platformAdmin.listPlatformTenants();
  },
  getPlatformTenant(id: string): Promise<PlatformTenant> {
    return getAdapters().platformAdmin.getPlatformTenant(id);
  },
  listPlatformSites(): Promise<PlatformSiteSummary[]> {
    return getAdapters().platformAdmin.listPlatformSites();
  },
  listPlatformSecuritySignals(): Promise<PlatformSecuritySignal[]> {
    return getAdapters().platformAdmin.listPlatformSecuritySignals();
  },
  listPlatformAdminTasks(): Promise<PlatformAdminTask[]> {
    return getAdapters().platformAdmin.listPlatformAdminTasks();
  },
  listPlatformUsageSummaries(): Promise<PlatformUsageSummary[]> {
    return getAdapters().platformAdmin.listPlatformUsageSummaries();
  },
  listPlatformSupportItems(): Promise<PlatformAdminTask[]> {
    return getAdapters().platformAdmin.listPlatformSupportItems();
  },
};
