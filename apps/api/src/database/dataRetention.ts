/**
 * Data retention + deletion policy DESIGN (design/contracts only — NO deletion jobs).
 *
 * Declarative retention policy for the future platform. There is NO scheduler, NO cron, NO
 * background job, and NO deletion runtime here — only policy descriptors and pure lookups.
 * Windows are design-time PLACEHOLDERS to be confirmed with legal/compliance before any real
 * deletion is implemented. See `security-model.md`.
 */
import type { SchemaTableName } from './schemaDesign';

/** A category of data with a shared retention rule. */
export type RetentionCategory =
  | 'support_conversations'
  | 'audit_logs'
  | 'sync_runs'
  | 'synced_snapshots'
  | 'plugin_events'
  | 'security_signals'
  | 'usage_records'
  | 'deleted_tenant'
  | 'deleted_site';

/** What happens to data when its retention window elapses. */
export type RetentionAction = 'delete' | 'anonymize' | 'archive' | 'preserve';

/** A retention policy for a category. */
export interface RetentionPolicy {
  category: RetentionCategory;
  /** Which tables this policy governs. */
  tables: SchemaTableName[];
  /** PLACEHOLDER default window (days) or 'indefinite'. Confirm with legal before enforcing. */
  defaultRetentionDays: number | 'indefinite';
  action: RetentionAction;
  /** Whether a legal hold can suspend the action. */
  legalHoldSupported: boolean;
  /** Whether audit-preservation rules can block deletion. */
  auditPreserved: boolean;
  description: string;
}

/** The retention policy catalog (design-time defaults; not enforced anywhere yet). */
export const RETENTION_POLICIES: readonly RetentionPolicy[] = [
  {
    category: 'support_conversations',
    tables: [
      'support_conversations',
      'support_messages',
      'support_internal_notes',
      'support_context_snapshots',
    ],
    defaultRetentionDays: 730,
    action: 'archive',
    legalHoldSupported: true,
    auditPreserved: false,
    description: 'Support history retained for ~2y, then archived; PII minimized.',
  },
  {
    category: 'audit_logs',
    tables: ['audit_logs'],
    defaultRetentionDays: 2555,
    action: 'preserve',
    legalHoldSupported: true,
    auditPreserved: true,
    description:
      'Audit logs preserved long-term (~7y) for security/compliance; never silently dropped.',
  },
  {
    category: 'sync_runs',
    tables: ['sync_runs'],
    defaultRetentionDays: 180,
    action: 'delete',
    legalHoldSupported: false,
    auditPreserved: false,
    description: 'Sync run metadata retained ~6 months, then pruned.',
  },
  {
    category: 'synced_snapshots',
    tables: ['synced_products', 'synced_orders', 'synced_customers'],
    defaultRetentionDays: 90,
    action: 'delete',
    legalHoldSupported: false,
    auditPreserved: false,
    description:
      'Only the latest snapshot is authoritative; superseded snapshot rows pruned ~90 days.',
  },
  {
    category: 'plugin_events',
    tables: ['plugin_events'],
    defaultRetentionDays: 90,
    action: 'delete',
    legalHoldSupported: false,
    auditPreserved: false,
    description: 'Summary events retained ~90 days for intelligence, then pruned.',
  },
  {
    category: 'security_signals',
    tables: ['security_signals'],
    defaultRetentionDays: 730,
    action: 'preserve',
    legalHoldSupported: true,
    auditPreserved: true,
    description: 'Security signals retained ~2y for investigation; safe summaries only.',
  },
  {
    category: 'usage_records',
    tables: ['usage_counters', 'usage_limits', 'ai_usage', 'sms_usage', 'media_generation_usage'],
    defaultRetentionDays: 1095,
    action: 'archive',
    legalHoldSupported: false,
    auditPreserved: false,
    description: 'Usage/billing-relevant counters retained ~3y for reconciliation, then archived.',
  },
  {
    category: 'deleted_tenant',
    tables: ['tenants'],
    defaultRetentionDays: 30,
    action: 'delete',
    legalHoldSupported: true,
    auditPreserved: true,
    description:
      'Soft-deleted tenants purged after a ~30d grace period unless under legal hold; audit preserved.',
  },
  {
    category: 'deleted_site',
    tables: ['sites'],
    defaultRetentionDays: 30,
    action: 'delete',
    legalHoldSupported: true,
    auditPreserved: true,
    description:
      'Disconnected/deleted sites purged after a ~30d grace period; credentials revoked immediately.',
  },
];

/** Look up the retention policy for a category. */
export function getRetentionPolicy(category: RetentionCategory): RetentionPolicy | undefined {
  return RETENTION_POLICIES.find((policy) => policy.category === category);
}

/** All retention categories. */
export function listRetentionCategories(): RetentionCategory[] {
  return RETENTION_POLICIES.map((policy) => policy.category);
}

/** Behavior when a tenant is deleted (design contract; not implemented). */
export interface TenantDeletionBehavior {
  softDeleteFirst: boolean;
  gracePeriodDays: number;
  /** Cascade target: all tenant-scoped tables. */
  cascade: 'all_tenant_scoped';
  /** Credentials revoked in the vault immediately on deletion request. */
  revokeCredentialsImmediately: boolean;
  /** Audit logs are preserved even after tenant purge. */
  auditLogsPreserved: boolean;
  /** A legal hold blocks purge until released. */
  legalHoldBlocksPurge: boolean;
  description: string;
}

/** Tenant deletion behavior (design-time defaults). */
export const TENANT_DELETION_BEHAVIOR: TenantDeletionBehavior = {
  softDeleteFirst: true,
  gracePeriodDays: 30,
  cascade: 'all_tenant_scoped',
  revokeCredentialsImmediately: true,
  auditLogsPreserved: true,
  legalHoldBlocksPurge: true,
  description:
    'Soft-delete the tenant, revoke all credentials in the vault immediately, purge tenant-scoped rows after the grace period (unless legal hold), and preserve audit logs.',
};

/** Behavior when a site is disconnected (design contract; not implemented). */
export interface SiteDisconnectBehavior {
  revokeCredentialsImmediately: boolean;
  /** Synced data is retained per the synced_snapshots policy, not deleted instantly. */
  syncedDataHandling: 'retain_per_policy';
  /** Plugin connection is marked disconnected. */
  markPluginConnectionDisconnected: boolean;
  /** Disconnect is recorded in the audit log. */
  auditRecorded: boolean;
  description: string;
}

/** Site disconnect behavior (design-time defaults). */
export const SITE_DISCONNECT_BEHAVIOR: SiteDisconnectBehavior = {
  revokeCredentialsImmediately: true,
  syncedDataHandling: 'retain_per_policy',
  markPluginConnectionDisconnected: true,
  auditRecorded: true,
  description:
    'Revoke credentials immediately, mark the plugin connection disconnected, retain synced summaries per policy, and record an audit entry.',
};

/** Audit-preservation rules (design contract). */
export const AUDIT_PRESERVATION_RULES = {
  description:
    'Audit logs and high-severity security signals are preserved independently of tenant/site deletion; they are never dropped by routine retention and survive tenant purge for compliance.',
  preservedCategories: ['audit_logs', 'security_signals'] as RetentionCategory[],
} as const;

/** Data-subject export/delete (DSAR) — designed now, IMPLEMENTED LATER. */
export const DATA_SUBJECT_REQUESTS_LATER = {
  export:
    'Tenant data export (summaries + gated PII the tenant owns) will be designed as an explicit, audited, permissioned flow in a later phase.',
  delete:
    'Customer/tenant deletion (right-to-erasure) will anonymize or remove gated PII while preserving required audit records, implemented in a later phase.',
  status: 'design_only',
} as const;
