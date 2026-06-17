/**
 * Production database SCHEMA DESIGN (design/contracts only — NO real DB).
 *
 * TypeScript record types that describe the FUTURE production database for the WordPress
 * Commerce OS platform. This file is **design only**: there is NO ORM, NO migration, NO SQL,
 * NO database client, and NO persistence. It exists so the tenant-isolation, visibility, and
 * retention contracts have concrete shapes to reason about before any real database lands.
 *
 * Binding design rules (see `security-model.md` + `accessPolicy.ts`):
 * - Every tenant-scoped row carries `tenantId`; site-scoped rows carry `siteId`; sync-derived
 *   rows carry `syncRunId`.
 * - NEVER store raw secrets (plugin signing secret, WooCommerce consumer secret, WordPress
 *   application password, webhook secret). Credentials are METADATA + an opaque vault
 *   reference only.
 * - No full customer PII unless a field is explicitly marked `*Restricted` (pii_restricted)
 *   and access-gated. No payment card details — billing rows hold provider metadata only.
 */
import type { CredentialKind, CredentialStorageStatus } from '../domain/credential';
import type {
  SiteConnectionCapability,
  SiteConnectionStatus,
  SiteEnvironment,
  SitePlatform,
  SiteId,
} from '../domain/site';
import type { TenantId, TenantPlan, TenantStatus } from '../domain/tenant';
import type { ApiRole, ApiUserId, ApiUserStatus } from '../domain/user';

// ---------------------------------------------------------------------------
// Identifier aliases (opaque, non-secret). Reuse existing domain ids where possible.
// ---------------------------------------------------------------------------

export type TenantMembershipId = string;
export type SiteConnectionId = string;
export type PluginConnectionId = string;
export type CredentialMetadataId = string;
export type VaultReferenceId = string;
export type SyncRunId = string;
export type SyncedProductId = string;
export type SyncedOrderId = string;
export type SyncedCustomerId = string;
export type PluginEventId = string;
export type SupportConversationId = string;
export type SupportMessageId = string;
export type SupportInternalNoteId = string;
export type SupportContextSnapshotId = string;
export type WorkflowItemId = string;
export type WorkflowEventId = string;
export type WorkflowAssignmentId = string;
export type SubscriptionId = string;
export type PlanId = string;
export type UsageLimitId = string;
export type UsageCounterId = string;
export type BillingEventId = string;
export type AuditLogRecordId = string;
export type SecuritySignalId = string;
export type AIUsageId = string;
export type SmsUsageId = string;
export type MediaGenerationUsageId = string;
export type CampaignId = string;
export type AutomationRuleId = string;

/** Common timestamp columns present on most rows (ISO-8601 strings). */
export interface RecordTimestamps {
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Core tenant / identity / site tables
// ---------------------------------------------------------------------------

/** An owning customer/organization (root of the `Tenant → Site → Resource` hierarchy). */
export interface TenantRecord extends RecordTimestamps {
  id: TenantId;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  region?: string;
  /** Soft-delete marker; hard deletion follows the retention policy + grace period. */
  deletedAt?: string;
  /** When true, retention deletion is suspended (legal hold). */
  legalHold?: boolean;
}

/**
 * A platform user. Merchants belong to a tenant via memberships; internal staff are flagged
 * with `isInternalStaff`. NO password / hash / token here — auth lives in a separate phase.
 */
export interface PlatformUserRecord extends RecordTimestamps {
  id: ApiUserId;
  /** Home tenant for merchant users; internal staff may have none. */
  primaryTenantId?: TenantId;
  displayName: string;
  status: ApiUserStatus;
  /** PII (pii_restricted). Stored normalized/gated; never broadly exposed. Empty by default. */
  emailRestricted?: string;
  isInternalStaff: boolean;
  lastLoginAt?: string;
}

/** Lifecycle of a tenant membership. */
export type TenantMembershipStatus = 'active' | 'invited' | 'suspended';

/** Join row binding a user to a tenant with a role (tenant-scoped). */
export interface TenantMembershipRecord extends RecordTimestamps {
  id: TenantMembershipId;
  tenantId: TenantId;
  userId: ApiUserId;
  role: ApiRole;
  status: TenantMembershipStatus;
  invitedByUserId?: ApiUserId;
}

/** A connected (or pending) WordPress/WooCommerce store (tenant-scoped). */
export interface SiteRecord extends RecordTimestamps {
  id: SiteId;
  tenantId: TenantId;
  displayName: string;
  url: string;
  platform: SitePlatform;
  environment: SiteEnvironment;
  status: SiteConnectionStatus;
  capabilities: SiteConnectionCapability[];
  lastSyncRunId?: SyncRunId;
  lastSyncAt?: string;
  disconnectedAt?: string;
  deletedAt?: string;
}

/** How a site connects to the platform. */
export type SiteConnectionChannel = 'proxy_rest_key' | 'companion_plugin' | 'managed_handover';

/** A connection channel for a site (tenant + site scoped). References credentials by metadata. */
export interface SiteConnectionRecord extends RecordTimestamps {
  id: SiteConnectionId;
  tenantId: TenantId;
  siteId: SiteId;
  channel: SiteConnectionChannel;
  status: SiteConnectionStatus;
  /** Opaque link to credential metadata (never the secret). */
  credentialMetadataId?: CredentialMetadataId;
  capabilities: SiteConnectionCapability[];
  verifiedAt?: string;
  revokedAt?: string;
}

/** Lifecycle of a companion-plugin connection. */
export type PluginConnectionStatus = 'pending' | 'active' | 'disconnected' | 'error';

/** Companion-plugin connection state for a site (tenant + site scoped). */
export interface PluginConnectionRecord extends RecordTimestamps {
  id: PluginConnectionId;
  tenantId: TenantId;
  siteId: SiteId;
  status: PluginConnectionStatus;
  pluginVersion?: string;
  /** OPAQUE vault reference to signing-secret material (security_restricted). Never the key. */
  signingKeyVaultRef?: VaultReferenceId;
  /** Non-secret signing-key identifier/fingerprint label for rotation tracking. */
  signingKeyId?: string;
  lastSeenAt?: string;
}

/**
 * Credential METADATA only (tenant + site scoped). Contains NO secret value — the raw secret
 * lives only in the future vault/KMS, referenced here by an opaque `vaultReference`.
 */
export interface CredentialMetadataRecord extends RecordTimestamps {
  id: CredentialMetadataId;
  tenantId: TenantId;
  siteId: SiteId;
  kind: CredentialKind;
  status: CredentialStorageStatus;
  /** OPAQUE external vault/KMS reference (security_restricted). Never the secret material. */
  vaultReference: VaultReferenceId;
  /** Masked, non-reversible display label (e.g. "woocommerce_rest_key ••••"). */
  maskedLabel: string;
  permissionScope: SiteConnectionCapability[];
  rotatedAt?: string;
  revokedAt?: string;
  lastUsedAt?: string;
}

// ---------------------------------------------------------------------------
// Sync tables (derived from validated, summary-only plugin sync data)
// ---------------------------------------------------------------------------

/** Persisted status of a production sync run. */
export type SyncRunDbStatus =
  | 'accepted_persisted'
  | 'accepted_empty'
  | 'rejected_validation'
  | 'rejected_signature'
  | 'rejected_replay'
  | 'failed';

/** Origin of a sync run. */
export type SyncRunDbSource = 'signed_delivery' | 'manual' | 'event_batch';

/** A single sync attempt for a site (tenant + site scoped). */
export interface SyncRunRecord extends RecordTimestamps {
  id: SyncRunId;
  tenantId: TenantId;
  siteId: SiteId;
  source: SyncRunDbSource;
  status: SyncRunDbStatus;
  startedAt: string;
  finishedAt?: string;
  productCount: number;
  orderCount: number;
  customerCount: number;
  eventCount: number;
  warningCount: number;
}

/** A synced product summary row (tenant + site + sync scoped). No raw meta/images. */
export interface SyncedProductRecord extends RecordTimestamps {
  id: SyncedProductId;
  tenantId: TenantId;
  siteId: SiteId;
  syncRunId: SyncRunId;
  /** Source store product id (non-secret external reference). */
  externalId: string;
  name?: string;
  sku?: string;
  status?: string;
  stockStatus?: string;
  price?: string;
  type?: string;
}

/** A synced order summary row (tenant + site + sync scoped). Generic customer label only. */
export interface SyncedOrderRecord extends RecordTimestamps {
  id: SyncedOrderId;
  tenantId: TenantId;
  siteId: SiteId;
  syncRunId: SyncRunId;
  externalId: string;
  number?: string;
  status?: string;
  currency?: string;
  total?: string;
  itemCount?: number;
  orderedAt?: string;
  /** Generic, non-PII label (e.g. "Customer #7"). Never email/name/phone. */
  customerLabel?: string;
  syncedCustomerId?: SyncedCustomerId;
}

/**
 * A synced customer summary row (tenant + site + sync scoped). Summary-only by default; raw
 * PII fields are explicitly `*Restricted` (pii_restricted), empty unless a feature + consent
 * require them, and access-gated.
 */
export interface SyncedCustomerRecord extends RecordTimestamps {
  id: SyncedCustomerId;
  tenantId: TenantId;
  siteId: SiteId;
  syncRunId: SyncRunId;
  externalId: string;
  /** Generic/masked label only (default). */
  label?: string;
  orderCount?: number;
  firstSeenAt?: string;
  /** RESTRICTED PII — empty by default; gated as pii_restricted. */
  emailRestricted?: string;
  /** RESTRICTED PII — empty by default; gated as pii_restricted. */
  phoneRestricted?: string;
}

/** A synced plugin event summary row (tenant + site scoped). Opaque references only; no PII. */
export interface PluginEventRecord extends RecordTimestamps {
  id: PluginEventId;
  tenantId: TenantId;
  siteId: SiteId;
  syncRunId?: SyncRunId;
  eventType: string;
  resourceType?: string;
  resourceId?: string;
  deliveryStatus?: string;
  occurredAt?: string;
}

// ---------------------------------------------------------------------------
// Support / admin tables
// ---------------------------------------------------------------------------

export type SupportConversationStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type SupportConversationChannel = 'support_inbox' | 'internal_request';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';

/** A support/internal-request conversation (tenant-scoped; site optional). */
export interface SupportConversationRecord extends RecordTimestamps {
  id: SupportConversationId;
  tenantId: TenantId;
  siteId?: SiteId;
  subject: string;
  status: SupportConversationStatus;
  channel: SupportConversationChannel;
  priority?: SupportPriority;
  assignedToUserId?: ApiUserId;
  lastMessageAt?: string;
  contextSnapshotId?: SupportContextSnapshotId;
}

export type SupportMessageAuthorType = 'merchant' | 'support_agent' | 'system';

/** A message within a support conversation (tenant-scoped). No secrets; PII discouraged. */
export interface SupportMessageRecord extends RecordTimestamps {
  id: SupportMessageId;
  tenantId: TenantId;
  conversationId: SupportConversationId;
  authorType: SupportMessageAuthorType;
  authorUserId?: ApiUserId;
  /** Message body (tenant_safe). Must never contain secrets; redacted on write. */
  body: string;
  /** Internal-only visibility flag. */
  internalOnly: boolean;
}

/** Sensitivity of an internal note. */
export type SupportNoteSensitivity = 'support_safe' | 'security_restricted';

/** An internal staff note on a conversation (tenant-scoped; never shown to merchants). */
export interface SupportInternalNoteRecord extends RecordTimestamps {
  id: SupportInternalNoteId;
  tenantId: TenantId;
  conversationId: SupportConversationId;
  authorUserId: ApiUserId;
  /** Note body — support_safe by default; security_restricted when about security. */
  body: string;
  sensitivity: SupportNoteSensitivity;
}

/** A summary-only context snapshot attached to a conversation (tenant-scoped). No PII/secrets. */
export interface SupportConversationContextSnapshot extends RecordTimestamps {
  id: SupportContextSnapshotId;
  tenantId: TenantId;
  conversationId: SupportConversationId;
  siteId?: SiteId;
  planLabel?: string;
  siteStatus?: SiteConnectionStatus;
  productCount?: number;
  orderCount?: number;
  /** Hard guarantee that this snapshot is summary-only. */
  summaryOnly: true;
}

export type WorkflowItemType =
  | 'onboarding'
  | 'provisioning'
  | 'connection_handoff'
  | 'support_followup'
  | 'internal_task';
export type WorkflowItemStatus = 'backlog' | 'in_progress' | 'blocked' | 'done' | 'cancelled';

/** A workflow/board item for internal operations (tenant-scoped; site optional). */
export interface WorkflowItemRecord extends RecordTimestamps {
  id: WorkflowItemId;
  tenantId: TenantId;
  siteId?: SiteId;
  type: WorkflowItemType;
  status: WorkflowItemStatus;
  title: string;
  priority?: SupportPriority;
  assignedToUserId?: ApiUserId;
  dueAt?: string;
}

/** A workflow transition/event (tenant-scoped). */
export interface WorkflowEventRecord extends RecordTimestamps {
  id: WorkflowEventId;
  tenantId: TenantId;
  workflowItemId: WorkflowItemId;
  eventType: string;
  fromStatus?: WorkflowItemStatus;
  toStatus?: WorkflowItemStatus;
  actorUserId?: ApiUserId;
}

/** A workflow assignment record (tenant-scoped). */
export interface WorkflowAssignmentRecord extends RecordTimestamps {
  id: WorkflowAssignmentId;
  tenantId: TenantId;
  workflowItemId: WorkflowItemId;
  assignedToUserId: ApiUserId;
  assignedByUserId?: ApiUserId;
  unassignedAt?: string;
}

// ---------------------------------------------------------------------------
// Subscription / usage / billing tables
// ---------------------------------------------------------------------------

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

/** A tenant subscription (tenant-scoped). Provider refs are billing_restricted metadata. */
export interface SubscriptionRecord extends RecordTimestamps {
  id: SubscriptionId;
  tenantId: TenantId;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAt?: string;
  /** Provider customer reference (billing_restricted). NO card/PAN data, ever. */
  providerCustomerRef?: string;
  /** Provider subscription reference (billing_restricted). */
  providerSubscriptionRef?: string;
}

/** A plan definition (global, not tenant-scoped). Entitlement flags only. */
export interface PlanRecord extends RecordTimestamps {
  id: PlanId;
  key: TenantPlan;
  displayName: string;
  /** Non-secret entitlement flags / numeric limits. */
  entitlements: Record<string, boolean | number>;
  /** Display-only price label (no payment data). */
  priceLabel?: string;
}

/** An immutable snapshot of plan entitlements captured on a subscription at a point in time. */
export interface PlanSnapshot {
  planId: PlanId;
  key: TenantPlan;
  entitlements: Record<string, boolean | number>;
  capturedAt: string;
}

/** A metered usage metric. */
export type UsageMetric =
  | 'sites'
  | 'synced_products'
  | 'synced_orders'
  | 'ai_messages'
  | 'sms_messages'
  | 'media_generations'
  | 'events';

export type UsagePeriod = 'day' | 'month' | 'billing_cycle' | 'total';

/** A configured usage limit for a tenant + metric (tenant-scoped). */
export interface UsageLimitRecord extends RecordTimestamps {
  id: UsageLimitId;
  tenantId: TenantId;
  metric: UsageMetric;
  limit: number;
  period: UsagePeriod;
}

/** A usage counter for a tenant + metric + period (tenant-scoped). */
export interface UsageCounterRecord extends RecordTimestamps {
  id: UsageCounterId;
  tenantId: TenantId;
  metric: UsageMetric;
  periodStart: string;
  periodEnd: string;
  used: number;
}

export type BillingEventType =
  | 'invoice_created'
  | 'invoice_paid'
  | 'payment_failed'
  | 'plan_changed'
  | 'subscription_canceled';

/** A billing event (tenant-scoped). Invoice METADATA only — no card data. billing_restricted. */
export interface BillingEventRecord extends RecordTimestamps {
  id: BillingEventId;
  tenantId: TenantId;
  subscriptionId?: SubscriptionId;
  type: BillingEventType;
  /** Display amount label only (e.g. "$29.00"); never a PAN or card detail. */
  amountLabel?: string;
  currency?: string;
  providerEventRef?: string;
  occurredAt: string;
}

// ---------------------------------------------------------------------------
// Audit / security tables
// ---------------------------------------------------------------------------

export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** An audit log row (tenant-scoped where applicable). Redacted, non-secret details only. */
export interface AuditLogRecord extends RecordTimestamps {
  id: AuditLogRecordId;
  tenantId?: TenantId;
  siteId?: SiteId;
  actorType: 'user' | 'system' | 'support';
  actorUserId?: ApiUserId;
  actorRole?: ApiRole;
  action: string;
  targetType?: string;
  targetId?: string;
  riskLevel: AuditRiskLevel;
  /** Redacted, non-secret context only. */
  details?: Record<string, string | number | boolean>;
  at: string;
}

export type SecuritySignalType =
  | 'invalid_signature'
  | 'replay_detected'
  | 'secret_detected_blocked'
  | 'pii_detected_blocked'
  | 'oversized_payload'
  | 'rate_limited'
  | 'permission_denied'
  | 'anomalous_access';

export type SecuritySignalSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/** A security signal row. Safe summary only — never the offending secret/PII value. */
export interface SecuritySignalRecord extends RecordTimestamps {
  id: SecuritySignalId;
  tenantId?: TenantId;
  siteId?: SiteId;
  type: SecuritySignalType;
  severity: SecuritySignalSeverity;
  /** Safe, non-secret summary (security_restricted). Never includes the raw value. */
  summary: string;
  sourceRunId?: SyncRunId;
  detectedAt: string;
}

// ---------------------------------------------------------------------------
// Future / later usage + growth tables (designed now, built later)
// ---------------------------------------------------------------------------

/** AI feature usage (tenant-scoped). Future phase. */
export interface AIUsageRecord extends RecordTimestamps {
  id: AIUsageId;
  tenantId: TenantId;
  siteId?: SiteId;
  feature: string;
  tokensInput?: number;
  tokensOutput?: number;
  providerRef?: string;
  occurredAt: string;
}

/** SMS usage (tenant-scoped). Future phase. Consent required; recipient stored as opaque ref. */
export interface SmsUsageRecord extends RecordTimestamps {
  id: SmsUsageId;
  tenantId: TenantId;
  siteId?: SiteId;
  campaignId?: CampaignId;
  segments: number;
  /** Opaque/hashed recipient reference (pii_restricted). NEVER a raw phone number. */
  recipientRef?: string;
  status?: string;
  occurredAt: string;
}

/** AI media-generation usage (tenant-scoped). Future phase. */
export interface MediaGenerationUsageRecord extends RecordTimestamps {
  id: MediaGenerationUsageId;
  tenantId: TenantId;
  siteId?: SiteId;
  taskType: string;
  outputCount: number;
  providerRef?: string;
  occurredAt: string;
}

export type CampaignChannel = 'sms' | 'email';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'canceled';

/** A marketing campaign (tenant-scoped). Future phase. */
export interface CampaignRecord extends RecordTimestamps {
  id: CampaignId;
  tenantId: TenantId;
  siteId?: SiteId;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  scheduledAt?: string;
}

/** An automation rule (tenant-scoped). Future phase. */
export interface AutomationRuleRecord extends RecordTimestamps {
  id: AutomationRuleId;
  tenantId: TenantId;
  siteId?: SiteId;
  trigger: string;
  action: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Table catalog + scoping descriptors
// ---------------------------------------------------------------------------

/** Stable table names for the production schema. */
export type SchemaTableName =
  | 'tenants'
  | 'platform_users'
  | 'tenant_memberships'
  | 'sites'
  | 'site_connections'
  | 'plugin_connections'
  | 'credential_metadata'
  | 'sync_runs'
  | 'synced_products'
  | 'synced_orders'
  | 'synced_customers'
  | 'plugin_events'
  | 'support_conversations'
  | 'support_messages'
  | 'support_internal_notes'
  | 'support_context_snapshots'
  | 'workflow_items'
  | 'workflow_events'
  | 'workflow_assignments'
  | 'subscriptions'
  | 'plans'
  | 'usage_limits'
  | 'usage_counters'
  | 'billing_events'
  | 'audit_logs'
  | 'security_signals'
  | 'ai_usage'
  | 'sms_usage'
  | 'media_generation_usage'
  | 'campaigns'
  | 'automation_rules';

/** Scoping + sensitivity descriptor for a table (drives isolation + validation). */
export interface SchemaTableDescriptor {
  table: SchemaTableName;
  /** Requires a `tenantId` column on every row. */
  tenantScoped: boolean;
  /** Requires a `siteId` column on every row. */
  siteScoped: boolean;
  /** Requires a `syncRunId` column on every row (derived from a sync run). */
  syncScoped: boolean;
  /** May hold explicitly-gated pii_restricted fields. */
  mayHoldRestrictedPii: boolean;
  /** Holds security_restricted metadata (never raw secrets). */
  holdsSecurityMetadata: boolean;
  description: string;
}

/** The full table catalog with scoping metadata. Design-time source of truth. */
export const SCHEMA_TABLES: readonly SchemaTableDescriptor[] = [
  {
    table: 'tenants',
    tenantScoped: false,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Owning organizations (tenant root).',
  },
  {
    table: 'platform_users',
    tenantScoped: false,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: true,
    holdsSecurityMetadata: false,
    description: 'Users; email is pii_restricted.',
  },
  {
    table: 'tenant_memberships',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'User↔tenant role bindings.',
  },
  {
    table: 'sites',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Connected stores.',
  },
  {
    table: 'site_connections',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: true,
    description: 'Connection channels; references credential metadata.',
  },
  {
    table: 'plugin_connections',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: true,
    description: 'Companion-plugin connections; vault refs only.',
  },
  {
    table: 'credential_metadata',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: true,
    description: 'Credential metadata + opaque vault reference (NO secret).',
  },
  {
    table: 'sync_runs',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Sync attempts per site.',
  },
  {
    table: 'synced_products',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: true,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Summary-only synced products.',
  },
  {
    table: 'synced_orders',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: true,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Summary-only synced orders; generic customer label.',
  },
  {
    table: 'synced_customers',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: true,
    mayHoldRestrictedPii: true,
    holdsSecurityMetadata: false,
    description: 'Summary-only synced customers; PII fields gated.',
  },
  {
    table: 'plugin_events',
    tenantScoped: true,
    siteScoped: true,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Summary-only plugin events.',
  },
  {
    table: 'support_conversations',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Support / internal-request conversations.',
  },
  {
    table: 'support_messages',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Conversation messages (redacted).',
  },
  {
    table: 'support_internal_notes',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: true,
    description: 'Internal staff notes; may be security_restricted.',
  },
  {
    table: 'support_context_snapshots',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Summary-only conversation context.',
  },
  {
    table: 'workflow_items',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Internal operations board items.',
  },
  {
    table: 'workflow_events',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Workflow transitions.',
  },
  {
    table: 'workflow_assignments',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Workflow assignments.',
  },
  {
    table: 'subscriptions',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Tenant subscriptions; provider refs billing_restricted.',
  },
  {
    table: 'plans',
    tenantScoped: false,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Global plan definitions / entitlements.',
  },
  {
    table: 'usage_limits',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Per-tenant usage limits.',
  },
  {
    table: 'usage_counters',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Per-tenant usage counters.',
  },
  {
    table: 'billing_events',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Billing events; invoice metadata only.',
  },
  {
    table: 'audit_logs',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: true,
    description: 'Privileged-action audit log (redacted).',
  },
  {
    table: 'security_signals',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: true,
    description: 'Security signals; safe summaries only.',
  },
  {
    table: 'ai_usage',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'AI usage (future).',
  },
  {
    table: 'sms_usage',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: true,
    holdsSecurityMetadata: false,
    description: 'SMS usage (future); recipient is opaque ref.',
  },
  {
    table: 'media_generation_usage',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Media generation usage (future).',
  },
  {
    table: 'campaigns',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Marketing campaigns (future).',
  },
  {
    table: 'automation_rules',
    tenantScoped: true,
    siteScoped: false,
    syncScoped: false,
    mayHoldRestrictedPii: false,
    holdsSecurityMetadata: false,
    description: 'Automation rules (future).',
  },
];

/** Look up a table descriptor by name. */
export function getSchemaTableDescriptor(
  table: SchemaTableName,
): SchemaTableDescriptor | undefined {
  return SCHEMA_TABLES.find((descriptor) => descriptor.table === table);
}

/** All table names in the schema. */
export function listAllSchemaTables(): SchemaTableName[] {
  return SCHEMA_TABLES.map((descriptor) => descriptor.table);
}

/** All tenant-scoped table names (every row must carry `tenantId`). */
export function listRequiredTenantScopedTables(): SchemaTableName[] {
  return SCHEMA_TABLES.filter((descriptor) => descriptor.tenantScoped).map((d) => d.table);
}

// ---------------------------------------------------------------------------
// Record scoping validation (design-time helper; pure)
// ---------------------------------------------------------------------------

/** A scoping violation found on a candidate row. */
export interface SchemaScopingIssue {
  table: SchemaTableName;
  field: 'tenantId' | 'siteId' | 'syncRunId';
  message: string;
}

/**
 * Validate that a candidate row carries the scoping columns its table requires
 * (`tenantId` / `siteId` / `syncRunId`). Pure; returns the list of violations (empty = ok).
 */
export function validateRecordScoping(
  table: SchemaTableName,
  record: Record<string, unknown>,
): SchemaScopingIssue[] {
  const descriptor = getSchemaTableDescriptor(table);
  const issues: SchemaScopingIssue[] = [];
  if (!descriptor) {
    return issues;
  }
  const hasValue = (key: string): boolean =>
    typeof record[key] === 'string' && (record[key] as string).length > 0;

  if (descriptor.tenantScoped && !hasValue('tenantId')) {
    issues.push({
      table,
      field: 'tenantId',
      message: `${table} is tenant-scoped and requires tenantId.`,
    });
  }
  if (descriptor.siteScoped && !hasValue('siteId')) {
    issues.push({
      table,
      field: 'siteId',
      message: `${table} is site-scoped and requires siteId.`,
    });
  }
  if (descriptor.syncScoped && !hasValue('syncRunId')) {
    issues.push({
      table,
      field: 'syncRunId',
      message: `${table} is sync-scoped and requires syncRunId.`,
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Sync read-model → database mapping (design description; pure)
// ---------------------------------------------------------------------------

/** A mapping from an in-memory sync read model to its future DB table(s). */
export interface ReadModelMapping {
  readModel: string;
  tables: SchemaTableName[];
  notes: string;
}

/** Describe how the existing in-memory sync read models map onto production tables. */
export function describeReadModelToDatabaseMapping(): ReadModelMapping[] {
  return [
    {
      readModel: 'SyncedSiteSnapshot',
      tables: ['sites', 'site_connections', 'sync_runs'],
      notes: 'Snapshot header → sites + site_connections; each ingest → one sync_runs row.',
    },
    {
      readModel: 'SyncedProductSummary',
      tables: ['synced_products'],
      notes: 'One row per product, sync-scoped.',
    },
    {
      readModel: 'SyncedOrderSummary',
      tables: ['synced_orders'],
      notes: 'One row per order; generic customer label only.',
    },
    {
      readModel: 'SyncedCustomerSummary',
      tables: ['synced_customers'],
      notes: 'Summary-only; PII fields gated + empty by default.',
    },
    {
      readModel: 'SyncedEventSummary',
      tables: ['plugin_events'],
      notes: 'One row per event; opaque references only.',
    },
    {
      readModel: 'SyncAuditEntry',
      tables: ['audit_logs', 'security_signals'],
      notes: 'Routed by type: routine → audit_logs; rejection/security → security_signals.',
    },
  ];
}

/** Boundaries that the production sync persistence path must enforce (design contract). */
export interface SyncPersistenceBoundaries {
  validationBeforePersistence: true;
  noRawPii: true;
  noRawSecrets: true;
  tenantScoped: true;
  siteScoped: true;
  directWordPressDatabaseAccess: 'forbidden';
  notes: string[];
}

/** Describe the non-negotiable boundaries for production sync persistence. */
export function describeSyncPersistenceBoundaries(): SyncPersistenceBoundaries {
  return {
    validationBeforePersistence: true,
    noRawPii: true,
    noRawSecrets: true,
    tenantScoped: true,
    siteScoped: true,
    directWordPressDatabaseAccess: 'forbidden',
    notes: [
      'Plugin/backend sync data MUST pass signature + PII + secret + cap validation before any write.',
      'All synced rows are written under the owning tenantId + siteId + syncRunId.',
      'The backend never reads or writes a WordPress/WooCommerce database directly.',
      'Raw PII / secrets are rejected (never persisted); only summaries + gated PII columns exist.',
    ],
  };
}
