/**
 * Secure handshake contract (skeleton).
 *
 * Models the server-to-server connection handshake between the backend (`apps/api`) and the
 * companion plugin. CONTRACT ONLY — there is NO crypto, NO signing, NO network, and NO
 * verification implementation in this PR.
 *
 * Design (implemented later):
 *  1. Backend issues a short-lived connection **intent** (requested read capabilities).
 *  2. Plugin reports its **site identity** + **capability snapshot** (no secrets).
 *  3. Backend returns a short-lived **challenge** (placeholder; no secret material here).
 *  4. Plugin signs/responds to the challenge — later.
 *  5. Backend verifies, applies replay protection, and audit-logs — later.
 *
 * Security: no long-lived shared secret on the client, no raw credential transfer, short-
 * lived challenge + replay protection + audit logging (all later). See `../SECURITY.md`.
 */
import type { CompanionPluginCapability } from './capabilities-contract';
import type { SiteCapabilitySnapshot, SiteId, SiteIdentity, TenantId } from './site-identity';

/** Lifecycle of a handshake. */
export type PluginHandshakeStatus =
  | 'initiated'
  | 'challenge_issued'
  | 'awaiting_plugin_response'
  | 'verified'
  | 'failed';

/** Why a handshake failed (safe, non-secret reasons). */
export type PluginHandshakeFailureReason =
  | 'site_unreachable'
  | 'ownership_unverified'
  | 'capability_missing'
  | 'challenge_expired'
  | 'replay_detected'
  | 'version_unsupported'
  | 'unknown';

/**
 * Backend → plugin connection intent. Declares which read capabilities the connection wants.
 * Carries only non-secret correlation references.
 */
export interface PluginConnectionIntent {
  /** Non-secret correlation id for this connection attempt. */
  intentId: string;
  tenantId: TenantId;
  requestedCapabilities: CompanionPluginCapability[];
  /** ISO-8601 timestamps. */
  issuedAt: string;
  expiresAt: string;
}

/**
 * Plugin → backend handshake request: the plugin's identity + capability snapshot in
 * response to an intent. No secrets, no credentials.
 */
export interface PluginHandshakeRequest {
  intentId: string;
  pluginVersion: string;
  siteIdentity: SiteIdentity;
  capabilitySnapshot: SiteCapabilitySnapshot;
  /** ISO-8601 timestamp. */
  requestedAt: string;
}

/**
 * Backend → plugin short-lived challenge placeholder. Contains NO secret material; the real
 * challenge value and signing algorithm are defined and exchanged server-side later.
 */
export interface PluginHandshakeChallenge {
  /** Non-secret challenge correlation id. */
  challengeId: string;
  /** ISO-8601 timestamps for the short-lived window. */
  issuedAt: string;
  expiresAt: string;
  /** Documentation-only hint; actual algorithm is decided in the crypto phase. */
  algorithmPlaceholder?: 'tbd_signed_challenge_later';
}

/** Backend → plugin handshake response. */
export interface PluginHandshakeResponse {
  status: PluginHandshakeStatus;
  /** Issued when the handshake reaches the challenge stage. */
  challenge?: PluginHandshakeChallenge;
  /** Opaque site reference, set only once verified. */
  siteId?: SiteId;
  /** Populated when `status === 'failed'`. */
  failureReason?: PluginHandshakeFailureReason;
  /** Safe, non-secret human-readable message. */
  message?: string;
}
