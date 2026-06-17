/**
 * Disconnect / revoke contract (skeleton).
 *
 * Models how a site connection would be torn down. CONTRACT ONLY — no real cleanup, no
 * network, no credential access. Documents the intended behavior so the future plugin and
 * backend agree. See `../SECURITY.md`.
 */
import type { SiteId, TenantId } from './site-identity';

/** Why a connection is being disconnected/revoked (safe, non-secret reasons). */
export type RevokeReason =
  | 'user_requested'
  | 'tenant_offboarded'
  | 'credentials_compromised'
  | 'plan_downgraded'
  | 'support_action'
  | 'unknown';

/** A cleanup step performed (or planned) on disconnect. */
export type CleanupAction =
  | 'stop_event_delivery'
  | 'revoke_credential_metadata'
  | 'remove_webhook_registration_later'
  | 'clear_connection_state'
  | 'preserve_audit_logs'
  | 'preserve_merchant_data_per_retention_later';

/** Lifecycle of a disconnect operation. */
export type DisconnectStatus = 'planned' | 'completed_later' | 'failed_later';

/** Request to disconnect/revoke a site connection. */
export interface DisconnectRequest {
  siteId: SiteId;
  tenantId?: TenantId;
  reason: RevokeReason;
  /** ISO-8601 timestamp. */
  requestedAt: string;
  /** Optional subset of cleanup actions to perform; defaults to the full plan below. */
  requestedActions?: CleanupAction[];
}

/** Result of a disconnect/revoke operation. */
export interface DisconnectResult {
  siteId: SiteId;
  status: DisconnectStatus;
  /** Actions that were performed (or planned) for this disconnect. */
  performedActions: CleanupAction[];
  /** Safe, non-secret message. */
  message?: string;
}

/**
 * The default cleanup plan and what each step means. Credential revocation happens through
 * the backend (the plugin never holds raw secrets). Audit logs are preserved; merchant data
 * retention follows the platform retention policy (later).
 */
export const DISCONNECT_CLEANUP_PLAN: readonly { action: CleanupAction; description: string }[] = [
  { action: 'stop_event_delivery', description: 'Stop forwarding any new events to the backend.' },
  {
    action: 'revoke_credential_metadata',
    description: 'Ask the backend to revoke this site\u2019s credential metadata (server-side).',
  },
  {
    action: 'remove_webhook_registration_later',
    description: 'Remove WooCommerce webhook registrations (webhook phase).',
  },
  {
    action: 'clear_connection_state',
    description: 'Clear the plugin\u2019s local connection state/reference.',
  },
  {
    action: 'preserve_audit_logs',
    description: 'Keep audit logs intact for accountability (never destroyed on disconnect).',
  },
  {
    action: 'preserve_merchant_data_per_retention_later',
    description: 'Retain merchant data per the platform retention policy (later).',
  },
] as const;
