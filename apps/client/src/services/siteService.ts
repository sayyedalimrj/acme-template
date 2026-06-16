/**
 * Site service — thin wrapper over the active SiteAdapter.
 *
 * Provides multi-site context (list/active/select) and mock connect/disconnect. Handles only
 * frontend-safe metadata; never credentials (see security steering).
 */
import { getAdapters } from '@/adapters';
import type { ConnectSiteInput, SiteConnection } from '@/domain/types';

export const siteService = {
  listSites(): Promise<SiteConnection[]> {
    return getAdapters().sites.listSites();
  },
  getActiveSite(): Promise<SiteConnection | null> {
    return getAdapters().sites.getActiveSite();
  },
  setActiveSite(siteId: string): Promise<SiteConnection> {
    return getAdapters().sites.setActiveSite(siteId);
  },
  connectMockSite(input: ConnectSiteInput): Promise<SiteConnection> {
    return getAdapters().sites.connectMockSite(input);
  },
  disconnectMockSite(siteId: string): Promise<void> {
    return getAdapters().sites.disconnectMockSite(siteId);
  },
};
