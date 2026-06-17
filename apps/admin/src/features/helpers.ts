/**
 * Presentation helpers — pure status → tone/label mappings for platform + workflow data.
 * Labels are admin LabelKeys; tones map to the admin Badge palette.
 */
import type { BadgeTone } from '@/ui';
import type { LabelKey } from '@/labels';
import type {
  PlatformAdminPriority,
  PlatformSecuritySeverity,
  PlatformSecuritySignalType,
  PlatformSignedSyncState,
  PlatformSiteConnectionStatus,
  PlatformSubscriptionState,
  PlatformSyncState,
  PlatformTenantStatus,
  PlatformPlanTier,
  PlatformAdminWorkflowStatus,
  WorkflowAutomationReadiness,
  WorkflowSla,
  WorkflowStatus,
  WorkflowType,
  SupportChannel,
  SupportConversationPriority,
  SupportConversationStatus,
  SupportSlaStatus,
  SupportVisibilityLevel,
} from '@/domain/types';

export interface Meta {
  tone: BadgeTone;
  labelKey: LabelKey;
}

export const HEALTH_LABEL_KEYS = {
  healthy: 'health.healthy',
  degraded: 'health.degraded',
  critical: 'health.critical',
} as const satisfies Record<string, LabelKey>;

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

export function securityTypeLabelKey(type: PlatformSecuritySignalType): LabelKey {
  const map: Record<PlatformSecuritySignalType, LabelKey> = {
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

export function adminTaskStatusMeta(status: PlatformAdminWorkflowStatus): Meta {
  const map: Record<PlatformAdminWorkflowStatus, Meta> = {
    open: { tone: 'neutral', labelKey: 'workflow.status.todo' },
    in_progress: { tone: 'info', labelKey: 'workflow.status.in_progress' },
    blocked: { tone: 'danger', labelKey: 'workflow.status.blocked' },
    waiting_customer: { tone: 'warning', labelKey: 'workflow.status.waiting_customer' },
    done: { tone: 'success', labelKey: 'workflow.status.done' },
  };
  return map[status];
}

export function planTierLabelKey(tier: PlatformPlanTier): LabelKey {
  const map: Record<PlatformPlanTier, LabelKey> = {
    starter: 'platformAdmin.tier.starter',
    growth: 'platformAdmin.tier.growth',
    pro: 'platformAdmin.tier.pro',
    managed: 'platformAdmin.tier.managed',
  };
  return map[tier];
}

// --- Workflow ---
export function workflowTypeLabelKey(type: WorkflowType): LabelKey {
  const map: Record<WorkflowType, LabelKey> = {
    store_launch: 'workflow.type.store_launch',
    existing_site_connection: 'workflow.type.existing_site_connection',
    template_setup: 'workflow.type.template_setup',
    support_handoff: 'workflow.type.support_handoff',
    plugin_health_issue: 'workflow.type.plugin_health_issue',
    sync_review: 'workflow.type.sync_review',
    security_review: 'workflow.type.security_review',
    billing_followup: 'workflow.type.billing_followup',
    customer_success: 'workflow.type.customer_success',
    internal_task: 'workflow.type.internal_task',
  };
  return map[type];
}

export function workflowStatusMeta(status: WorkflowStatus): Meta {
  const map: Record<WorkflowStatus, Meta> = {
    backlog: { tone: 'neutral', labelKey: 'workflow.status.backlog' },
    todo: { tone: 'neutral', labelKey: 'workflow.status.todo' },
    in_progress: { tone: 'info', labelKey: 'workflow.status.in_progress' },
    waiting_customer: { tone: 'warning', labelKey: 'workflow.status.waiting_customer' },
    waiting_internal: { tone: 'warning', labelKey: 'workflow.status.waiting_internal' },
    blocked: { tone: 'danger', labelKey: 'workflow.status.blocked' },
    review: { tone: 'info', labelKey: 'workflow.status.review' },
    done: { tone: 'success', labelKey: 'workflow.status.done' },
    canceled: { tone: 'neutral', labelKey: 'workflow.status.canceled' },
  };
  return map[status];
}

export function slaMeta(sla: WorkflowSla): Meta {
  const map: Record<WorkflowSla, Meta> = {
    on_track: { tone: 'success', labelKey: 'workflow.sla.on_track' },
    due_soon: { tone: 'warning', labelKey: 'workflow.sla.due_soon' },
    overdue: { tone: 'danger', labelKey: 'workflow.sla.overdue' },
    paused: { tone: 'neutral', labelKey: 'workflow.sla.paused' },
    no_sla: { tone: 'neutral', labelKey: 'workflow.sla.no_sla' },
  };
  return map[sla];
}

export function readinessLabelKey(readiness: WorkflowAutomationReadiness): LabelKey {
  const map: Record<WorkflowAutomationReadiness, LabelKey> = {
    manual_only_now: 'workflow.readiness.manual_only_now',
    automation_candidate_later: 'workflow.readiness.automation_candidate_later',
    requires_backend_later: 'workflow.readiness.requires_backend_later',
    requires_provider_later: 'workflow.readiness.requires_provider_later',
  };
  return map[readiness];
}

/** Which board column a workflow status belongs to. */
export type BoardColumnKey = 'backlog' | 'inProgress' | 'waitingBlocked' | 'review' | 'done';
export function columnForStatus(status: WorkflowStatus): BoardColumnKey | null {
  if (status === 'canceled') return null;
  if (status === 'backlog' || status === 'todo') return 'backlog';
  if (status === 'in_progress') return 'inProgress';
  if (status === 'waiting_customer' || status === 'waiting_internal' || status === 'blocked')
    return 'waitingBlocked';
  if (status === 'review') return 'review';
  return 'done';
}


// --- Support inbox ---
export function supportStatusMeta(status: SupportConversationStatus): Meta {
  const map: Record<SupportConversationStatus, Meta> = {
    open: { tone: 'info', labelKey: 'support.status.open' },
    pending: { tone: 'neutral', labelKey: 'support.status.pending' },
    waiting_customer: { tone: 'warning', labelKey: 'support.status.waiting_customer' },
    waiting_internal: { tone: 'warning', labelKey: 'support.status.waiting_internal' },
    resolved: { tone: 'success', labelKey: 'support.status.resolved' },
    closed: { tone: 'neutral', labelKey: 'support.status.closed' },
  };
  return map[status];
}

export function supportPriorityMeta(priority: SupportConversationPriority): Meta {
  const map: Record<SupportConversationPriority, Meta> = {
    low: { tone: 'neutral', labelKey: 'support.priority.low' },
    normal: { tone: 'info', labelKey: 'support.priority.normal' },
    high: { tone: 'warning', labelKey: 'support.priority.high' },
    urgent: { tone: 'danger', labelKey: 'support.priority.urgent' },
  };
  return map[priority];
}

export function supportSlaMeta(sla: SupportSlaStatus): Meta {
  const map: Record<SupportSlaStatus, Meta> = {
    on_track: { tone: 'success', labelKey: 'support.sla.on_track' },
    due_soon: { tone: 'warning', labelKey: 'support.sla.due_soon' },
    overdue: { tone: 'danger', labelKey: 'support.sla.overdue' },
    paused: { tone: 'neutral', labelKey: 'support.sla.paused' },
    no_sla: { tone: 'neutral', labelKey: 'support.sla.no_sla' },
  };
  return map[sla];
}

export function supportChannelLabelKey(channel: SupportChannel): LabelKey {
  const map: Record<SupportChannel, LabelKey> = {
    chat: 'support.channel.chat',
    email: 'support.channel.email',
    phone_note: 'support.channel.phone_note',
    whatsapp_later: 'support.channel.whatsapp_later',
    system_note: 'support.channel.system_note',
  };
  return map[channel];
}

export interface VisibilityMeta {
  tone: BadgeTone;
  labelKey: LabelKey;
  descKey: LabelKey;
}

export function visibilityMeta(level: SupportVisibilityLevel): VisibilityMeta {
  const map: Record<SupportVisibilityLevel, VisibilityMeta> = {
    safe_summary: { tone: 'success', labelKey: 'support.visibility.safe_summary', descKey: 'support.visibility.safe_summary.desc' },
    support_context: { tone: 'info', labelKey: 'support.visibility.support_context', descKey: 'support.visibility.support_context.desc' },
    restricted_billing: { tone: 'warning', labelKey: 'support.visibility.restricted_billing', descKey: 'support.visibility.restricted_billing.desc' },
    restricted_security: { tone: 'warning', labelKey: 'support.visibility.restricted_security', descKey: 'support.visibility.restricted_security.desc' },
    never_expose_secret: { tone: 'danger', labelKey: 'support.visibility.never_expose_secret', descKey: 'support.visibility.never_expose_secret.desc' },
  };
  return map[level];
}
