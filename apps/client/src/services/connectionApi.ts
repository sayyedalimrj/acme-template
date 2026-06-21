/**
 * Site connection helpers (http). The merchant connects a WooCommerce store by entering its REST
 * consumer key/secret; the backend verifies them server-side and seals them in its credential
 * vault. The frontend NEVER stores or transmits these keys anywhere except this single backend
 * verify call over HTTPS.
 */
import { http, ApiError } from '@/services/httpClient';

export interface VerifyWooResult {
  site: { id: string; status: string; currency: string };
}

/**
 * Map a backend Woo connection error to a SPECIFIC Persian message. The connect/re-test flow must
 * never collapse a real backend error into a generic "request took too long" — each known code has
 * its own message; anything else falls back to the backend's own message.
 */
export function wooConnectErrorMessage(err: unknown): string {
  const code = err instanceof ApiError ? err.code : '';
  switch (code) {
    case 'woo_auth_failed':
      return 'کلیدهای ووکامرس معتبر نیستند یا دسترسی کافی ندارند.';
    case 'woo_forbidden':
      return 'کلید واردشده دسترسی لازم برای خواندن/نوشتن اطلاعات فروشگاه را ندارد.';
    case 'woo_timeout':
    case 'timeout':
      return 'اتصال به فروشگاه بیش از حد طول کشید. لطفاً دوباره تلاش کنید.';
    case 'woo_network_error':
    case 'woo_unavailable':
    case 'network_error':
      return 'فروشگاه در دسترس نیست یا ارتباط سرور با آن برقرار نشد.';
    case 'sync_failed':
      return 'اتصال ذخیره شد، اما همگام‌سازی انجام نشد. از دکمه همگام‌سازی دوباره تلاش کنید.';
    default:
      return err instanceof Error && err.message ? err.message : 'خطایی رخ داد. دوباره تلاش کنید.';
  }
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

/**
 * Start a full WooCommerce sync in the background (returns 202 immediately). The UI then polls the
 * status endpoint for progress; it never blocks the merchant on the long catalog/orders pull.
 */
export function triggerSiteSync(siteId: string): Promise<{ ok: boolean; status: string }> {
  return http.post<{ ok: boolean; status: string }>(
    `/merchant/sites/${encodeURIComponent(siteId)}/sync`,
  );
}

/**
 * Remove this store connection from JetWeb only (soft delete): revokes the stored credentials and
 * marks the local connection disconnected. The real WooCommerce/WordPress store is NEVER touched.
 */
export function deleteSite(siteId: string): Promise<{ ok: boolean }> {
  return http.del<{ ok: boolean }>(`/merchant/sites/${encodeURIComponent(siteId)}`);
}
