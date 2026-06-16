/**
 * Mock Site adapter.
 *
 * Manages multi-site context in memory: the list of connected sites, the active site, and
 * mock connect/disconnect. Stores ONLY frontend-safe metadata (name, URL, status) — never
 * WooCommerce keys/secrets or WordPress application passwords. Real connections go through
 * the future backend/proxy (see security steering).
 */
import { DEFAULT_ACTIVE_SITE_ID, sites as seedSites } from '@/mock/data/sites';
import type { ConnectSiteInput, SiteConnection } from '@/domain/types';

import type { SiteAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockSiteAdapter(): SiteAdapter {
  let sites: SiteConnection[] = clone(seedSites);
  let activeSiteId: string | null = sites.some((s) => s.id === DEFAULT_ACTIVE_SITE_ID)
    ? DEFAULT_ACTIVE_SITE_ID
    : (sites[0]?.id ?? null);
  let nextId = 1;

  return {
    async listSites(): Promise<SiteConnection[]> {
      await delay(150);
      return clone(sites);
    },
    async getActiveSite(): Promise<SiteConnection | null> {
      await delay(100);
      const active = sites.find((s) => s.id === activeSiteId) ?? null;
      return active ? clone(active) : null;
    },
    async setActiveSite(siteId: string): Promise<SiteConnection> {
      await delay(100);
      const target = sites.find((s) => s.id === siteId);
      if (!target) {
        throw new Error(`Site not found: ${siteId}`);
      }
      activeSiteId = siteId;
      return clone(target);
    },
    async connectMockSite(input: ConnectSiteInput): Promise<SiteConnection> {
      await delay(250);
      // NOTE: deliberately ignores/accepts no secret fields. A real connection would be
      // established server-side via the backend/proxy and return a connection reference.
      const site: SiteConnection = {
        id: `site_mock_${nextId++}`,
        name: input.name,
        url: input.url,
        status: 'connected',
        currency: 'USD',
        lastSyncedAt: new Date().toISOString(),
      };
      sites = [...sites, site];
      if (!activeSiteId) {
        activeSiteId = site.id;
      }
      return clone(site);
    },
    async disconnectMockSite(siteId: string): Promise<void> {
      await delay(150);
      sites = sites.filter((s) => s.id !== siteId);
      if (activeSiteId === siteId) {
        activeSiteId = sites[0]?.id ?? null;
      }
    },
  };
}
