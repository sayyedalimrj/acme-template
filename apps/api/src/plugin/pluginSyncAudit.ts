/**
 * Sync audit helpers (backend skeleton).
 *
 * Pure builders for summary-only `SyncAuditEntry` records. Audit entries carry only safe,
 * non-secret scalars (site id, action label, status, timestamp, short detail) — NEVER raw
 * bodies, PII, or secrets. There is no logging side effect and no persistence here; callers
 * store entries in the in-memory dev repository. See `security-model.md`.
 */
import type { SiteId } from '../domain/site';
import type { TenantId } from '../domain/tenant';
import type { SyncAuditEntry, SyncRunStatus } from './pluginReadModels';
import type { PluginSyncPersistenceStatus } from './pluginSyncState';

/** Stable audit action labels for the sync persistence flow. */
export const SYNC_AUDIT_ACTIONS = {
  validated: 'plugin.sync.validated',
  persistedDev: 'plugin.sync.persisted.dev',
  rejected: 'plugin.sync.rejected',
  eventBatch: 'plugin.sync.events.persisted.dev',
} as const;

/** Map a persistence status to the audit action label that best describes it. */
export function auditActionForStatus(status: PluginSyncPersistenceStatus): string {
  switch (status) {
    case 'accepted_persisted_dev':
      return SYNC_AUDIT_ACTIONS.persistedDev;
    case 'accepted_not_persisted':
      return SYNC_AUDIT_ACTIONS.validated;
    default:
      return SYNC_AUDIT_ACTIONS.rejected;
  }
}

/** Input for building a sync audit entry (non-secret scalars only). */
export interface BuildSyncAuditEntryInput {
  id: string;
  siteId: SiteId;
  tenantId?: TenantId;
  status: SyncRunStatus;
  /** ISO-8601 timestamp. */
  at: string;
  action?: string;
  detail?: string;
}

/**
 * Build a summary-only audit entry. The `detail` is truncated defensively to keep entries
 * small and safe; it must never contain PII or secrets (callers pass only safe summaries).
 */
export function buildSyncAuditEntry(input: BuildSyncAuditEntryInput): SyncAuditEntry {
  const detail =
    typeof input.detail === 'string' && input.detail.length > 200
      ? `${input.detail.slice(0, 200)}…`
      : input.detail;
  return {
    id: input.id,
    siteId: input.siteId,
    tenantId: input.tenantId,
    action: input.action ?? auditActionForStatus(input.status),
    status: input.status,
    at: input.at,
    detail,
  };
}
