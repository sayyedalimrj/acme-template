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


// ---------------------------------------------------------------------------------------------
// Support Inbox (internal) — our team supporting SaaS customers, with customer context beside
// the conversation. MOCK-ONLY: no real chat/email/WhatsApp/phone provider, no message sending,
// no PII, no secrets, no billing IDs, no WooCommerce/plugin credentials, no customer DB access.
// ---------------------------------------------------------------------------------------------
export type SupportChannel = 'chat' | 'email' | 'phone_note' | 'whatsapp_later' | 'system_note';

export type SupportConversationStatus =
  | 'open'
  | 'pending'
  | 'waiting_customer'
  | 'waiting_internal'
  | 'resolved'
  | 'closed';

export type SupportConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportSlaStatus = 'on_track' | 'due_soon' | 'overdue' | 'paused' | 'no_sla';

/**
 * Data-visibility level for a context section. Drives the (future) RBAC gate: agents see safe
 * summaries by default; billing/security need extra permission; secrets are never exposed.
 */
export type SupportVisibilityLevel =
  | 'safe_summary'
  | 'support_context'
  | 'restricted_billing'
  | 'restricted_security'
  | 'never_expose_secret';

export type SupportMessageAuthor = 'customer' | 'agent' | 'system';

export interface SupportAssignee {
  id: string;
  /** Fake demo agent label (never real PII). */
  label: string;
  role?: string;
}

export interface SupportMessage {
  id: string;
  author: SupportMessageAuthor;
  /** Display-only author label (fake). */
  authorLabel: string;
  at: ISODate;
  /** Frontend-safe message body (no PII/secrets/order details). */
  body: string;
}

export interface SupportInternalNote {
  id: string;
  authorLabel: string;
  at: ISODate;
  body: string;
}

export interface SupportCannedReply {
  id: string;
  title: string;
  body: string;
  tags?: string[];
}

/** A workflow item linked to a conversation (resolved by the service from the workflow mock). */
export interface SupportLinkedWorkflowItem {
  id: string;
  title: string;
  status: WorkflowStatus;
}

/** A security/audit signal linked to a conversation (resolved from the platform mock). */
export interface SupportRelatedSignal {
  id: string;
  type: PlatformSecuritySignalType;
  severity: PlatformSecuritySeverity;
  message: string;
}

/**
 * The Customer Context Panel projection — a safe, read-only summary the support agent sees
 * beside the conversation. Built by the service from platform data; never includes raw PII or
 * secrets. Restricted sections (billing/security) are flagged for future RBAC, not hidden data.
 */
export interface SupportConversationContext {
  tenantId: string;
  tenantName: string;
  tenantStatus: PlatformTenantStatus;
  plan: PlatformPlanTier;
  subscriptionState: PlatformSubscriptionState;
  mrr: Money;
  currency: CurrencyCode;
  renewsAt?: ISODate;
  trialEndsAt?: ISODate;
  supportOwner?: string;
  sitesCount: number;
  tenantHealthScore: number;
  onboardingComplete: boolean;
  openWorkflowTasks: number;
  openSupportCount: number;
  // Active/related site (when the conversation references one)
  siteId?: string;
  siteName?: string;
  siteHealthScore?: number;
  connection?: PlatformSiteConnectionStatus;
  pluginVersion?: string;
  latestPluginVersion?: string;
  wooCommerceActive?: boolean;
  syncState?: PlatformSyncState;
  signedSync?: PlatformSignedSyncState;
  lastSyncAt?: ISODate;
  queuedEvents?: number;
  // Usage / limits summary
  apiCalls?: number;
  apiLimit?: number;
  ordersSynced?: number;
  usageNearLimit?: boolean;
  /** Recent security/audit signal ids for this tenant (resolved for display in the panel). */
  recentSecuritySignalIds: string[];
}

/** One row of the data-access policy shown in the detail screen (future RBAC). */
export interface SupportDataAccessPolicy {
  level: SupportVisibilityLevel;
  /** Whether a default support agent may see this section without extra permission. */
  allowedByDefault: boolean;
}

/** A conversation as authored in the mock fixtures (before the service attaches context). */
export interface SupportConversationSeed {
  id: string;
  tenantId: string;
  tenantName: string;
  siteId?: string;
  siteName?: string;
  channel: SupportChannel;
  status: SupportConversationStatus;
  priority: SupportConversationPriority;
  assignee: SupportAssignee | null;
  sla: SupportSlaStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  subject: string;
  lastMessagePreview: string;
  unreadCount: number;
  tags: string[];
  relatedWorkflowIds: string[];
  relatedSecuritySignalIds: string[];
  relatedSiteSignalNote?: string;
  messages: SupportMessage[];
  internalNotes: SupportInternalNote[];
}

/** A conversation as returned by the service (seed + resolved context/links/signals). */
export interface SupportConversation extends SupportConversationSeed {
  context: SupportConversationContext;
  linkedWorkflows: SupportLinkedWorkflowItem[];
  relatedSignals: SupportRelatedSignal[];
}

export interface SupportOverviewKpis {
  open: number;
  urgent: number;
  overdueSla: number;
  waitingCustomer: number;
  unassigned: number;
  resolvedThisWeek: number;
}

/** Result of a mock action (no persistence, no provider call). */
export interface SupportMockActionResult {
  ok: true;
  conversationId: string;
  message: string;
}
