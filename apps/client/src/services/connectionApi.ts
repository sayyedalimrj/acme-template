/**
 * Site connection helpers (http). The merchant connects a WooCommerce store by entering its REST
 * consumer key/secret; the backend verifies them server-side and seals them in its credential
 * vault. The frontend NEVER stores or transmits these keys anywhere except this single backend
 * verify call over HTTPS.
 */
import { http } from '@/services/httpClient';

export interface VerifyWooResult {
  site: { id: string; status: string; currency: string };
}

/** Verify + persist WooCommerce REST credentials for a pending site. */
export function verifyWooConnection(
  siteId: string,
  consumerKey: string,
  consumerSecret: string,
): Promise<VerifyWooResult> {
  return http.post<VerifyWooResult>('/merchant/sites/connect/verify', {
    siteId,
    consumerKey,
    consumerSecret,
  });
}

/** Frontend-safe site metadata returned by the status endpoint (never includes secrets). */
export interface SiteStatusSite {
  id: string;
  name: string;
  url: string;
  connection_mode: 'woo_rest' | 'plugin';
  status: string;
  currency: string;
  woo_version: string | null;
  wp_version: string | null;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface PluginConnectionStatus {
  status: string;
  plugin_version: string | null;
  last_seen_at: string | null;
}

export interface LastSyncStatus {
  status: string;
  stats: Record<string, number> | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface SiteStatusResult {
  site: SiteStatusSite;
  /** Present only when the store is connected via the WordPress plugin transport. */
  plugin: PluginConnectionStatus | null;
  /** The most recent sync run (REST or plugin), or null if none has run yet. */
  lastSync: LastSyncStatus | null;
}

/**
 * Read the real connection + sync status for a site: backend-confirmed connection state, plugin
 * vs REST mode, last sync time, and the last sync error (if any). No secrets are returned.
 */
export function getSiteStatus(siteId: string): Promise<SiteStatusResult> {
  return http.get<SiteStatusResult>(`/merchant/sites/${encodeURIComponent(siteId)}/status`);
}

export interface UpdateSiteSettingsInput {
  name?: string;
  url?: string;
}

/**
 * Safely edit a connected store's display name and/or URL. The backend re-validates the URL
 * (SSRF-guarded) and, if the host actually changes, sets the site back to `pending` so the
 * merchant must re-verify the connection. Secrets are never sent or returned here.
 */
export function updateSiteSettings(
  siteId: string,
  input: UpdateSiteSettingsInput,
): Promise<{ site: SiteStatusSite }> {
  return http.patch<{ site: SiteStatusSite }>(
    `/merchant/sites/${encodeURIComponent(siteId)}`,
    input,
  );
}
