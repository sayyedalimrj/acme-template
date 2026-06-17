/**
 * Platform Admin presentation helpers — pure status → tone/label mappings.
 *
 * Keep mapping logic out of screens so it stays testable and consistent. Every label is an
 * i18n key (en + fa), and tones map to the shared Badge/StatusBadge palette.
 */
import type { BadgeTone } from '@/components/ui';
import type { StringKey } from '@/i18n/strings';
import type {
  PlatformAdminPriority,
  PlatformAdminWorkflowStatus,
  PlatformPlanTier,
  PlatformSecuritySeverity,
  PlatformSecuritySignalType,
  PlatformSignedSyncState,
  PlatformSiteConnectionStatus,
  PlatformSubscriptionState,
  PlatformSyncState,
  PlatformTenantStatus,
} from '@/domain/types';

export interface Meta {
  tone: BadgeTone;
  labelKey: StringKey;
}

export function tenantStatusMeta(status: PlatformTenantStatus): Meta {
  const map: Record<PlatformTenantStatus, Meta> = {
    active: { tone: 'success', labelKey: 'platformAdmin.tenantStatus.active' },
    trialing: { tone: 'info', labelKey: 'platformAdmin.tenantStatus.trialing' },
    past_due: { tone: 'warning', labelKey: 'platformAdmin.tenantStatus.past_due' },
    canceled: { tone: 'neutral', labelKey: 'platformAdmin.tenantStatus.canceled' },
    suspended: { tone: 'danger', labelKey: 'platformAdmin.tenantStatus.suspended' },
  };
  return map[status];
}

export function subscriptionStateMeta(state: PlatformSubscriptionState): Meta {
  const map: Record<PlatformSubscriptionState, Meta> = {
    trialing: { tone: 'info', labelKey: 'platformAdmin.subState.trialing' },
    active: { tone: 'success', labelKey: 'platformAdmin.subState.active' },
    past_due: { tone: 'warning', labelKey: 'platformAdmin.subState.past_due' },
    canceled: { tone: 'neutral', labelKey: 'platformAdmin.subState.canceled' },
  };
  return map[state];
}

export function connectionMeta(status: PlatformSiteConnectionStatus): Meta {
  const map: Record<PlatformSiteConnectionStatus, Meta> = {
    connected: { tone: 'success', labelKey: 'platformAdmin.connection.connected' },
    pending: { tone: 'warning', labelKey: 'platformAdmin.connection.pending' },
    disconnected: { tone: 'neutral', labelKey: 'platformAdmin.connection.disconnected' },
    error: { tone: 'danger', labelKey: 'platformAdmin.connection.error' },
  };
  return map[status];
}

export function syncStateMeta(state: PlatformSyncState): Meta {
  const map: Record<PlatformSyncState, Meta> = {
    healthy: { tone: 'success', labelKey: 'platformAdmin.sync.healthy' },
    delayed: { tone: 'warning', labelKey: 'platformAdmin.sync.delayed' },
    stalled: { tone: 'danger', labelKey: 'platformAdmin.sync.stalled' },
    never: { tone: 'neutral', labelKey: 'platformAdmin.sync.never' },
  };
  return map[state];
}

export function signedStateMeta(state: PlatformSignedSyncState): Meta {
  const map: Record<PlatformSignedSyncState, Meta> = {
    verified: { tone: 'success', labelKey: 'platformAdmin.signed.verified' },
    unsigned: { tone: 'neutral', labelKey: 'platformAdmin.signed.unsigned' },
    invalid: { tone: 'danger', labelKey: 'platformAdmin.signed.invalid' },
    disabled: { tone: 'neutral', labelKey: 'platformAdmin.signed.disabled' },
  };
  return map[state];
}

export function severityMeta(severity: PlatformSecuritySeverity): Meta {
  const map: Record<PlatformSecuritySeverity, Meta> = {
    info: { tone: 'info', labelKey: 'platformAdmin.severity.info' },
    warning: { tone: 'warning', labelKey: 'platformAdmin.severity.warning' },
    critical: { tone: 'danger', labelKey: 'platformAdmin.severity.critical' },
  };
  return map[severity];
}

export function securityTypeLabelKey(type: PlatformSecuritySignalType): StringKey {
  const map: Record<PlatformSecuritySignalType, StringKey> = {
    raw_secret_rejected: 'platformAdmin.secType.raw_secret_rejected',
    invalid_signature: 'platformAdmin.secType.invalid_signature',
    replay_rejected: 'platformAdmin.secType.replay_rejected',
    permission_denied: 'platformAdmin.secType.permission_denied',
    sync_validation_failed: 'platformAdmin.secType.sync_validation_failed',
    webhook_rejected: 'platformAdmin.secType.webhook_rejected',
    audit_event: 'platformAdmin.secType.audit_event',
  };
  return map[type];
}

export function priorityMeta(priority: PlatformAdminPriority): Meta {
  const map: Record<PlatformAdminPriority, Meta> = {
    low: { tone: 'neutral', labelKey: 'platformAdmin.priority.low' },
    medium: { tone: 'info', labelKey: 'platformAdmin.priority.medium' },
    high: { tone: 'warning', labelKey: 'platformAdmin.priority.high' },
    urgent: { tone: 'danger', labelKey: 'platformAdmin.priority.urgent' },
  };
  return map[priority];
}

export function workflowStatusMeta(status: PlatformAdminWorkflowStatus): Meta {
  const map: Record<PlatformAdminWorkflowStatus, Meta> = {
    open: { tone: 'neutral', labelKey: 'platformAdmin.workflow.open' },
    in_progress: { tone: 'info', labelKey: 'platformAdmin.workflow.in_progress' },
    blocked: { tone: 'danger', labelKey: 'platformAdmin.workflow.blocked' },
    waiting_customer: { tone: 'warning', labelKey: 'platformAdmin.workflow.waiting_customer' },
    done: { tone: 'success', labelKey: 'platformAdmin.workflow.done' },
  };
  return map[status];
}

export function planTierLabelKey(tier: PlatformPlanTier): StringKey {
  const map: Record<PlatformPlanTier, StringKey> = {
    starter: 'platformAdmin.tier.starter',
    growth: 'platformAdmin.tier.growth',
    pro: 'platformAdmin.tier.pro',
    managed: 'platformAdmin.tier.managed',
  };
  return map[tier];
}

/** Translated band labels for HealthScoreBadge (reuses the shared health.* strings). */
export const HEALTH_LABEL_KEYS = {
  healthy: 'health.healthy',
  degraded: 'health.degraded',
  critical: 'health.critical',
} as const;
