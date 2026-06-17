/**
 * Plugin signed-delivery response + handler-context contracts (backend skeleton).
 *
 * The handler is framework-agnostic and pure: it returns a `PluginDeliveryResult` (with a
 * suggested HTTP status code) rather than touching any HTTP/server. Security dependencies
 * (signing-secret provider, replay guard, clock) are injected via the context. See
 * `security-model.md`.
 */
import type { SafeApiError } from '../security/errors';
import type { ReplayGuard } from './pluginReplayGuard';
import type { PluginSigningSecretProvider } from './pluginSigningSecret';
import type { PluginSyncIssue, SiteSyncSnapshot } from './pluginSyncEnvelope';

/** Stable, safe delivery error codes. */
export type PluginDeliveryErrorCode =
  | 'missing_headers'
  | 'invalid_timestamp'
  | 'replayed'
  | 'signature_not_configured'
  | 'invalid_signature'
  | 'invalid_payload'
  | 'internal_error';

/** Injected security dependencies for the delivery handler. */
export interface PluginDeliverySecurityContext {
  /** Resolves signing material + metadata for a site (e.g. from the future vault). */
  signatureProvider: PluginSigningSecretProvider;
  /** In-memory replay guard (no persistence). */
  replayGuard: ReplayGuard;
  /** Current time as ms epoch (injectable for deterministic tests). Defaults to Date.now(). */
  now?: number;
  /** Max allowed clock skew in seconds (default 300). */
  maxSkewSeconds?: number;
}

/** Context passed to the delivery handler. */
export interface PluginDeliveryHandlerContext {
  security: PluginDeliverySecurityContext;
}

/** Result of handling a signed delivery request. Framework-agnostic; no HTTP performed. */
export interface PluginDeliveryResult {
  accepted: boolean;
  /** Suggested HTTP status code for a future transport to use. */
  statusCodeSuggestion: number;
  /** Present when rejected. */
  errorCode?: PluginDeliveryErrorCode;
  error?: SafeApiError;
  warnings: PluginSyncIssue[];
  /** Present when accepted (in-memory read model; never persisted). */
  snapshot?: SiteSyncSnapshot;
  /** Suggested audit action a caller should record. */
  auditActionSuggestion: string;
}
