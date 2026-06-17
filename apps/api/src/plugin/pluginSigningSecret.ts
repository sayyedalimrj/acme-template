/**
 * Plugin signing-secret metadata (backend skeleton).
 *
 * METADATA ONLY. There is NO raw secret value in this metadata, NO secret examples, NO env
 * file, and NO real vault. The actual signing material is *injected* at call time through a
 * `PluginSigningSecretProvider` (resolved from the future backend vault) and is never stored
 * or committed. See `security-model.md`.
 */
import type { SiteId } from '../domain/site';

/** Lifecycle of a per-site signing secret. */
export type PluginSigningSecretStatus =
  | 'not_configured'
  | 'configured_in_backend_later'
  | 'rotated_later'
  | 'revoked'
  | 'invalid';

/** Non-secret metadata about a signing secret — never the value itself. */
export interface PluginSigningSecretMetadata {
  siteId: SiteId;
  status: PluginSigningSecretStatus;
  /** Optional non-secret key identifier (not the key material). */
  keyId?: string;
  /** ISO-8601 timestamps. */
  createdAt?: string;
  rotatedAt?: string;
}

/**
 * Resolution returned by a provider. `material` is the injected signing key — present only
 * when a provider is explicitly wired (e.g. dev/tests). It is NEVER persisted or committed.
 */
export interface PluginSigningSecretResolution {
  metadata: PluginSigningSecretMetadata;
  /** Injected signing material (raw key). Absent when not configured. */
  material?: string;
}

/** A function that resolves signing material + metadata for a site (injected dependency). */
export type PluginSigningSecretProvider = (siteId: SiteId) => PluginSigningSecretResolution;

/**
 * The default provider: signing is NOT configured and no material is available. Used until a
 * real backend vault provider is injected.
 */
export const notConfiguredSigningSecretProvider: PluginSigningSecretProvider = (siteId) => ({
  metadata: { siteId, status: 'not_configured' },
});
