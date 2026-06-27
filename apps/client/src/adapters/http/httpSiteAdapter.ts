/**
 * HTTP Site adapter — talks to OUR backend (`/merchant/sites`). Returns frontend-safe metadata
 * only (no credentials). The real connect flow (REST key/secret or plugin) is handled by
 * `connectionApi` + the Connect-Site screen; this adapter covers list/active/disconnect.
 */
import { http } from '@/services/httpClient';
import type { ConnectSiteInput, SiteConnection, SiteStatus } from '@/domain/types';

import type { SiteAdapter } from '../types';
import { getActiveHttpSiteId, setActiveHttpSiteId } from './httpActiveSite';

interface BackendSite {
  id: string;
  name: string;
  url: string;
  status: string;
  currency: string;
  connection_mode?: string;
  woo_version: string | null;
  wp_version: string | null;
  last_synced_at: string | null;
}

interface ConnectStartResponse {
  siteId: string;
  tenantId?: string;
  connectionId?: string;
  mode?: string;
  deliveryBaseUrl?: string;
  signingSecret?: string;
}

function toSite(s: BackendSite): SiteConnection {
  const status: SiteStatus =
    s.status === 'connected' || s.status === 'pending' || s.status === 'error'
      ? (s.status as SiteStatus)
      : 'disconnected';
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    status,
    currency: s.currency,
    connectionMode:
      s.connection_mode === 'plugin' || s.connection_mode === 'woo_rest'
        ? s.connection_mode
        : undefined,
    wooVersion: s.woo_version ?? undefined,
    wpVersion: s.wp_version ?? undefined,
    lastSyncedAt: s.last_synced_at ?? undefined,
  };
}

export function createHttpSiteAdapter(): SiteAdapter {
  return {
    async listSites(): Promise<SiteConnection[]> {
      const res = await http.get<{ sites: BackendSite[] }>('/merchant/sites');
      const sites = res.sites.map(toSite);
      // Default the active site to the first connected one if none chosen yet.
      if (!getActiveHttpSiteId()) {
        const first = sites.find((s) => s.status === 'connected') ?? sites[0];
        if (first) setActiveHttpSiteId(first.id);
      }
      return sites;
    },
    async getActiveSite(): Promise<SiteConnection | null> {
      const res = await http.get<{ sites: BackendSite[] }>('/merchant/sites');
      const sites = res.sites.map(toSite);
      let id = getActiveHttpSiteId();
      if (!id) {
        const first = sites.find((s) => s.status === 'connected') ?? sites[0];
        id = first?.id ?? null;
        setActiveHttpSiteId(id);
      }
      return sites.find((s) => s.id === id) ?? null;
    },
    async setActiveSite(siteId: string): Promise<SiteConnection> {
      const res = await http.get<{ site: BackendSite }>(`/merchant/sites/${siteId}/status`);
      setActiveHttpSiteId(siteId);
      return toSite(res.site);
    },
    async connectMockSite(input: ConnectSiteInput): Promise<SiteConnection & { pluginPairing?: ConnectStartResponse }> {
      const mode = input.mode ?? 'woo_rest';
      const res = await http.post<ConnectStartResponse>('/merchant/sites/connect/start', {
        name: input.name,
        url: input.url,
        mode,
      });
      const site: SiteConnection & { pluginPairing?: ConnectStartResponse } = {
        id: res.siteId,
        name: input.name,
        url: input.url,
        status: 'pending',
        currency: 'IRT',
        connectionMode: mode,
      };
      if (mode === 'plugin' && res.signingSecret && res.tenantId && res.deliveryBaseUrl) {
        site.pluginPairing = res;
      }
      return site;
    },
    async disconnectMockSite(siteId: string): Promise<void> {
      await http.post(`/merchant/sites/${siteId}/disconnect`);
      if (getActiveHttpSiteId() === siteId) setActiveHttpSiteId(null);
    },
  };
}
