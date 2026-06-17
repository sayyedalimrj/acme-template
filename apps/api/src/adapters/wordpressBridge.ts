/**
 * WordPress bridge contract (backend skeleton).
 *
 * INTERFACE ONLY. No real WordPress REST calls, no application passwords, no companion
 * plugin handshake implementation, no credentials. The provided stub returns safe
 * `not_implemented` errors. The bridge is how a site is securely verified/connected
 * server-side; the client only ever receives an opaque connection reference and frontend-
 * safe results. See `security-model.md`.
 */
import type { RequestContext } from '../domain/permission';
import type { SiteConnectionHealth, SiteId } from '../domain/site';
import { createSafeError, type Result } from '../security/errors';

/** Result of verifying that the connecting tenant controls a site URL. */
export interface SiteOwnershipVerification {
  siteUrl: string;
  verified: boolean;
  /** Safe, non-secret status note. */
  message?: string;
}

/**
 * Descriptor returned when starting an application-password connection flow. Contains only
 * non-secret references — never the application password itself (it is exchanged
 * server-side and stored only in the future vault).
 */
export interface ApplicationPasswordFlowStart {
  /** Non-secret correlation id for the in-progress flow. */
  flowId: string;
  /** Safe, human-readable next-step instructions. */
  instructions: string;
}

/** Result of a companion-plugin handshake (server-to-server). */
export interface CompanionPluginHandshakeResult {
  siteId: SiteId;
  verified: boolean;
  message?: string;
}

/**
 * The WordPress bridge. All methods are server-side and credential-bearing in the future;
 * none are implemented in this skeleton.
 */
export interface WordPressBridge {
  verifySiteOwnership(
    siteUrl: string,
    context: RequestContext,
  ): Promise<Result<SiteOwnershipVerification>>;
  startApplicationPasswordFlow(
    siteId: SiteId,
    context: RequestContext,
  ): Promise<Result<ApplicationPasswordFlowStart>>;
  /**
   * Verify the callback of an application-password flow. The skeleton signature accepts only
   * a non-secret `flowId` — raw application passwords are never passed through this layer in
   * a way the client can observe.
   */
  verifyApplicationPasswordCallback(
    siteId: SiteId,
    flowId: string,
    context: RequestContext,
  ): Promise<Result<SiteConnectionHealth>>;
  verifyCompanionPluginHandshake(
    siteId: SiteId,
    context: RequestContext,
  ): Promise<Result<CompanionPluginHandshakeResult>>;
  getSiteHealth(siteId: SiteId, context: RequestContext): Promise<Result<SiteConnectionHealth>>;
  disconnectSite(siteId: SiteId, context: RequestContext): Promise<Result<{ disconnected: true }>>;
}

function requireSiteId(siteId: SiteId): Result<never> | null {
  if (!siteId || siteId.trim().length === 0) {
    return { ok: false, error: createSafeError('validation_error', 'A siteId is required.') };
  }
  return null;
}

/** A stub bridge that performs no network calls and returns safe `not_implemented` errors. */
export function createNotImplementedWordPressBridge(): WordPressBridge {
  const reject = async <T>(siteId: SiteId, operation: string): Promise<Result<T>> => {
    const missing = requireSiteId(siteId);
    if (missing) {
      return missing;
    }
    return { ok: false, error: createSafeError('not_implemented', undefined, { operation }) };
  };

  return {
    // verifySiteOwnership has no siteId yet (site may not exist), so reject directly.
    verifySiteOwnership: async (siteUrl) => {
      if (!siteUrl || siteUrl.trim().length === 0) {
        return { ok: false, error: createSafeError('validation_error', 'A siteUrl is required.') };
      }
      return {
        ok: false,
        error: createSafeError('not_implemented', undefined, { operation: 'verifySiteOwnership' }),
      };
    },
    startApplicationPasswordFlow: (siteId) => reject(siteId, 'startApplicationPasswordFlow'),
    verifyApplicationPasswordCallback: (siteId) =>
      reject(siteId, 'verifyApplicationPasswordCallback'),
    verifyCompanionPluginHandshake: (siteId) => reject(siteId, 'verifyCompanionPluginHandshake'),
    getSiteHealth: (siteId) => reject(siteId, 'getSiteHealth'),
    disconnectSite: (siteId) => reject(siteId, 'disconnectSite'),
  };
}
