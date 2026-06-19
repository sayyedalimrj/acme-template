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
