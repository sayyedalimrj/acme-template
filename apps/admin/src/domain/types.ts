/**
 * Admin domain types (frontend-safe, mock-only).
 *
 * Two groups:
 *  1. Platform* — OUR internal view of SaaS customers/tenants, sites, subscriptions, plugin/
 *     sync health, security signals, usage (ported from the dormant client mock).
 *  2. Workflow* — the internal Workflow Operations board (tasks across the customer lifecycle).
 *
 * SECURITY/PRIVACY (binding): no real PII (fake demo labels only), no secrets, no billing
 * provider IDs, no plugin signing secrets, no WooCommerce credentials. MRR/limits are
 * display-only mock numbers. Future source of truth is the platform DB via `apps/api`.
 */

// Base aliases (this app keeps its own; future `packages/types` will unify with the client).
export type ISODate = string;
export type Money = string;
export type CurrencyCode = string;

// ---------------------------------------------------------------------------------------------
// Platform (tenants / sites / subscriptions / health / security / usage)
// ---------------------------------------------------------------------------------------------
export type PlatformTenantStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'suspended';
export type PlatformSubscriptionState = 'trialing' | 'active' | 'past_due' | 'canceled';
export type PlatformPlanTier = 'starter' | 'growth' | 'pro' | 'managed';
export type PlatformAdminPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PlatformAdminWorkflowStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'waiting_customer'
  | 'done';
export type PlatformSiteConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type PlatformSyncState = 'healthy' | 'delayed' | 'stalled' | 'never';
export type PlatformSignedSyncState = 'verified' | 'unsigned' | 'invalid' | 'disabled';
export type PlatformSecuritySignalType =
  | 'raw_secret_rejected'
  | 'invalid_signature'
  | 'replay_rejected'
  | 'permission_denied'
  | 'sync_validation_failed'
  | 'webhook_rejected'
  | 'audit_event';
export type PlatformSecuritySeverity = 'info' | 'warning' | 'critical';

export interface PlatformCustomerOwner {
  label: string;
  email: string;
  role?: string;
}

export interface PlatformPluginHealthSummary {
  pluginVersion: string;
  latestVersion: string;
  wooCommerceActive: boolean;
  score: number;
  note?: string;
}

export interface PlatformSyncHealthSummary {
  state: PlatformSyncState;
  signed: PlatformSignedSyncState;
  lastSyncAt?: ISODate;
  queuedEvents: number;
  failures: number;
}

export interface PlatformSiteSummary {
  id: string;
  tenantId: string;
  url: string;
  name: string;
  platform: 'woocommerce' | 'wordpress';
  connection: PlatformSiteConnectionStatus;
  plugin: PlatformPluginHealthSummary;
  sync: PlatformSyncHealthSummary;
  healthScore: number;
}

export interface PlatformSubscriptionSummary {
  tier: PlatformPlanTier;
  state: PlatformSubscriptionState;
  mrr: Money;
  currency: CurrencyCode;
  renewsAt?: ISODate;
  trialEndsAt?: ISODate;
}

export interface PlatformSupportSummary {
  openItems: number;
  priority: PlatformAdminPriority;
  owner?: string;
  oldestOpenHours?: number;
}

export interface PlatformUsageSummary {
  tenantId: string;
  ordersSynced: number;
  eventsCaptured: number;
  apiCalls: number;
  apiLimit: number;
  sitesUsed: number;
  sitesLimit: number;
  nearLimit: boolean;
}

export interface PlatformSecuritySignal {
  id: string;
  tenantId: string;
  siteId?: string;
  type: PlatformSecuritySignalType;
  severity: PlatformSecuritySeverity;
  message: string;
  createdAt: ISODate;
  acknowledged: boolean;
}

export interface PlatformTenant {
  id: string;
  name: string;
  owner: PlatformCustomerOwner;
  status: PlatformTenantStatus;
  subscription: PlatformSubscriptionSummary;
  support: PlatformSupportSummary;
  sitesCount: number;
  onboardingComplete: boolean;
  healthScore: number;
  lastActiveAt: ISODate;
  internalNote?: string;
}

export interface PlatformAdminTask {
  id: string;
  title: string;
  status: PlatformAdminWorkflowStatus;
  priority: PlatformAdminPriority;
  owner?: string;
  dueAt?: ISODate;
  tenantId?: string;
  siteId?: string;
  nextAction: string;
  blockedReason?: string;
}

export interface PlatformAdminOverview {
  kpis: {
    totalCustomers: number;
    activeSites: number;
    mrr: Money;
    currency: CurrencyCode;
    openSupport: number;
    syncIssues: number;
    securityAlerts: number;
  };
  atRiskTenants: PlatformTenant[];
  sitesAtRisk: PlatformSiteSummary[];
  topTasks: PlatformAdminTask[];
  recentSecuritySignals: PlatformSecuritySignal[];
  subscriptionBreakdown: { state: PlatformSubscriptionState; count: number }[];
}

// ---------------------------------------------------------------------------------------------
// Workflow Operations board
// ---------------------------------------------------------------------------------------------
export type WorkflowType =
  | 'store_launch'
  | 'existing_site_connection'
  | 'template_setup'
  | 'support_handoff'
  | 'plugin_health_issue'
  | 'sync_review'
  | 'security_review'
  | 'billing_followup'
  | 'customer_success'
  | 'internal_task';

export type WorkflowStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_internal'
  | 'blocked'
  | 'review'
  | 'done'
  | 'canceled';

export type WorkflowPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkflowSla = 'on_track' | 'due_soon' | 'overdue' | 'paused' | 'no_sla';

/** Future automation posture (no engine built yet). */
export type WorkflowAutomationReadiness =
  | 'manual_only_now'
  | 'automation_candidate_later'
  | 'requires_backend_later'
  | 'requires_provider_later';

export interface WorkflowChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface WorkflowTimelineEvent {
  id: string;
  at: ISODate;
  label: string;
}

export interface WorkflowItem {
  id: string;
  type: WorkflowType;
  title: string;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  sla: WorkflowSla;
  tenantId?: string;
  tenantName?: string;
  siteId?: string;
  siteName?: string;
  owner?: string;
  dueAt?: ISODate;
  nextAction: string;
  blockedReason?: string;
  checklist: WorkflowChecklistItem[];
  timeline: WorkflowTimelineEvent[];
  relatedSignalIds?: string[];
  /** Future-ready automation concepts (labels only; actions remain disabled/mock). */
  automationReadiness: WorkflowAutomationReadiness;
  trigger?: string;
  condition?: string;
  action?: string;
}

export interface WorkflowBoardKpis {
  open: number;
  urgent: number;
  overdue: number;
  blocked: number;
  waitingCustomer: number;
  doneThisWeek: number;
}
