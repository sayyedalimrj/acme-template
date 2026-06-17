/**
 * Controlled dev sync state + status model (backend skeleton).
 *
 * Defines the safe, stable status union for the controlled DEVELOPMENT-ONLY read-only sync
 * persistence flow, the two delivery modes, and pure helpers that classify validation issues
 * and delivery error codes into a status. There is NO mutation, NO network, NO database, and
 * NO real production sync here — these are pure value mappings only. See `security-model.md`.
 */
import type { PluginDeliveryErrorCode } from './pluginDeliveryResponse';
import type { PluginSyncIssue } from './pluginSyncEnvelope';

/**
 * Stable, safe status for a sync persistence attempt. `*_persisted_dev` is the ONLY status
 * under which anything is stored, and only ever into the in-memory dev repository.
 */
export type PluginSyncPersistenceStatus =
  | 'accepted_not_persisted'
  | 'accepted_persisted_dev'
  | 'rejected_invalid_signature'
  | 'rejected_replay'
  | 'rejected_validation'
  | 'rejected_secret_detected'
  | 'rejected_pii_detected'
  | 'rejected_oversized'
  | 'not_configured';

/**
 * Delivery handling mode.
 * - `validate_only` — validate the signed envelope but NEVER persist (the safe default).
 * - `validate_and_persist_dev` — validate, then persist a normalized snapshot into the
 *   in-memory dev repository ONLY (never a database, never the network).
 */
export type PluginDeliveryMode = 'validate_only' | 'validate_and_persist_dev';

/** The safe default mode: validate only, never persist. */
export const DEFAULT_PLUGIN_DELIVERY_MODE: PluginDeliveryMode = 'validate_only';

/** True only for the explicit dev-persist mode. */
export function isPersistMode(mode: PluginDeliveryMode | undefined): boolean {
  return mode === 'validate_and_persist_dev';
}

/**
 * Classify a set of validation issues into the most specific rejection status. Secret and PII
 * detections take precedence (they are the most sensitive), then oversize, then generic
 * validation. Returns `rejected_validation` when there are no recognized codes.
 */
export function classifyValidationIssues(
  issues: readonly PluginSyncIssue[] | undefined,
): PluginSyncPersistenceStatus {
  const codes = (issues ?? []).map((issue) => issue.code);
  if (codes.some((code) => code === 'raw_secret_field')) {
    return 'rejected_secret_detected';
  }
  if (codes.some((code) => code.startsWith('raw_pii'))) {
    return 'rejected_pii_detected';
  }
  if (codes.some((code) => code === 'resource_list_oversize')) {
    return 'rejected_oversized';
  }
  return 'rejected_validation';
}

/**
 * Map a delivery handler error code (and any validation issues) to a persistence status. Used
 * so a rejected signed delivery still reports a precise, safe persistence status.
 */
export function mapDeliveryErrorCodeToStatus(
  code: PluginDeliveryErrorCode,
  issues?: readonly PluginSyncIssue[],
): PluginSyncPersistenceStatus {
  switch (code) {
    case 'invalid_signature':
      return 'rejected_invalid_signature';
    case 'replayed':
      return 'rejected_replay';
    case 'signature_not_configured':
      return 'not_configured';
    case 'invalid_payload':
      return classifyValidationIssues(issues);
    case 'missing_headers':
    case 'invalid_timestamp':
    case 'internal_error':
    default:
      return 'rejected_validation';
  }
}
