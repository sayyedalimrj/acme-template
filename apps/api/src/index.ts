/**
 * Public barrel for the backend/proxy skeleton (`apps/api`).
 *
 * Re-exports the domain types, security helpers, adapter contracts + not-implemented stubs,
 * route contracts, and secret-free mocks. Dependency-free; no runtime/server is started.
 *
 * NOTE: `apps/client` must NOT import from this package. This is a backend contract surface.
 */

// Domain models
export type { Tenant, TenantId, TenantStatus, TenantPlan } from './domain/tenant';
export type { ApiUser, ApiUserId, ApiRole, ApiUserStatus } from './domain/user';
export type {
  Site,
  SiteId,
  SiteConnectionStatus,
  SitePlatform,
  SiteEnvironment,
  SiteConnectionCapability,
  SiteConnectionHealth,
  SiteConnectionHealthState,
} from './domain/site';
export type {
  CredentialId,
  CredentialKind,
  CredentialStorageStatus,
  CredentialRecordMetadata,
} from './domain/credential';
export type {
  AuditLogEntry,
  AuditActor,
  AuditAction,
  AuditTarget,
  AuditRiskLevel,
} from './domain/auditLog';
export type {
  Permission,
  PermissionAction,
  PermissionScope,
  PermissionCheckResult,
  RequestContext,
} from './domain/permission';
export { ROLE_PERMISSIONS, checkPermission, permissionsForRole } from './domain/permission';

// Security
export {
  REDACTED,
  containsSensitiveKey,
  containsSensitiveText,
  redactSensitiveText,
  redactDeep,
} from './security/redaction';
export type { ApiErrorCode, SafeApiError, Result } from './security/errors';
export {
  createSafeError,
  redactErrorDetails,
  notImplemented,
  notConfigured,
} from './security/errors';
export {
  findRawSecretFields,
  assertNoRawSecretFields,
  buildCredentialMetadata,
  canUseCredentialForCapability,
  credentialStatusLabel,
} from './security/credentialPolicy';
export type { BuildCredentialMetadataInput } from './security/credentialPolicy';

// Adapter contracts + not-implemented stubs
export type {
  WooCommerceProxy,
  ProxyReportPeriod,
  ProxyProduct,
  ProxyOrder,
  ProxyCustomer,
  ProxyReport,
  ProxyCollection,
  ProxyListQuery,
} from './adapters/woocommerceProxy';
export { createNotImplementedWooCommerceProxy } from './adapters/woocommerceProxy';
export type {
  WordPressBridge,
  SiteOwnershipVerification,
  ApplicationPasswordFlowStart,
  CompanionPluginHandshakeResult,
} from './adapters/wordpressBridge';
export { createNotImplementedWordPressBridge } from './adapters/wordpressBridge';
export type {
  WebhookReceiver,
  WebhookEventEnvelope,
  WebhookEventType,
  WebhookVerificationResult,
  WebhookIdempotencyRecord,
  WebhookProcessingStatus,
} from './adapters/webhookReceiver';
export {
  verifyWebhookSignaturePlaceholder,
  createNotImplementedWebhookReceiver,
} from './adapters/webhookReceiver';

// Route contracts (documentation/types only)
export type { HttpMethod, RouteContract } from './routes/contracts';
export { ROUTE_CONTRACTS } from './routes/contracts';

// Secret-free mocks
export { mockTenants, mockApiUsers } from './mock/mockTenants';
export { mockSites } from './mock/mockSites';

// Plugin read-only sync foundation (contracts + pure validators/ingestors; no persistence)
export type {
  PluginSyncEnvelope,
  PluginSyncSource,
  PluginSyncConnection,
  PluginSyncPayload,
  PluginSyncResourceSummary,
  PluginSyncIssue,
  PluginSyncValidationResult,
  PluginSyncIngestResult,
  PluginEventIngestResult,
  PluginConnectionRecord,
  PluginDeliveryStatus,
  PluginSignatureBlock,
  PluginSignatureVerificationResult,
  SiteSyncSnapshot,
} from './plugin/pluginSyncEnvelope';
export {
  PLUGIN_SYNC_SCHEMA_VERSION,
  MAX_SYNC_RESOURCE_RECORDS,
  MAX_SYNC_EVENT_RECORDS,
} from './plugin/pluginSyncEnvelope';
export {
  validatePluginSyncEnvelope,
  validateNoRawPII,
  validateNoRawSecrets,
  validateResourceCaps,
  normalizePluginSyncPayload,
} from './plugin/pluginSyncValidator';
export {
  ingestPluginSyncEnvelope,
  buildSiteSyncSnapshot,
  mapPluginProductsToReadModel,
  mapPluginOrdersToReadModel,
  mapPluginCustomersToReadModel,
} from './plugin/pluginSyncIngestor';
export { ingestPluginEventBatch } from './plugin/pluginEventIngestor';
export {
  PLUGIN_SIGNATURE_ALGORITHM,
  buildSignatureBaseString,
  signPluginSyncPayload,
  verifyPluginSyncSignature,
  safeCompareSignatures,
  verifyPluginSignaturePlaceholder,
} from './plugin/pluginSignature';
export type { PluginSignatureInput } from './plugin/pluginSignature';
export { sha256Hex, hmacSha256Hex } from './plugin/pluginCrypto';
export type {
  PluginSigningSecretStatus,
  PluginSigningSecretMetadata,
  PluginSigningSecretResolution,
  PluginSigningSecretProvider,
} from './plugin/pluginSigningSecret';
export { notConfiguredSigningSecretProvider } from './plugin/pluginSigningSecret';
export type { ReplayRequestRef, ReplayCheckResult, ReplayGuard } from './plugin/pluginReplayGuard';
export {
  buildReplayKey,
  checkReplayWindow,
  createInMemoryReplayGuard,
  recordOrRejectReplay,
  resetDefaultReplayGuard,
} from './plugin/pluginReplayGuard';
export type {
  PluginDeliveryHeaders,
  PluginDeliveryBody,
  PluginDeliveryRequest,
} from './plugin/pluginDeliveryRequest';
export type {
  PluginDeliveryErrorCode,
  PluginDeliverySecurityContext,
  PluginDeliveryHandlerContext,
  PluginDeliveryResult,
} from './plugin/pluginDeliveryResponse';
export { handlePluginSyncDelivery } from './plugin/pluginDeliveryEndpoint';
export {
  registerPluginConnectionPlaceholder,
  getPluginConnectionStatus,
  disconnectPluginConnectionPlaceholder,
  resetPluginConnectionRegistry,
} from './plugin/pluginConnectionRegistry';
export type { RegisterPluginConnectionInput } from './plugin/pluginConnectionRegistry';

// Controlled DEV read-only sync persistence (in-memory only; no DB, no network, no mutation)
export type { PluginSyncPersistenceStatus, PluginDeliveryMode } from './plugin/pluginSyncState';
export {
  DEFAULT_PLUGIN_DELIVERY_MODE,
  isPersistMode,
  classifyValidationIssues,
  mapDeliveryErrorCodeToStatus,
} from './plugin/pluginSyncState';
export type {
  SyncSource,
  SyncRunStatus,
  SyncedStoreSummary,
  SyncedProductSummary,
  SyncedOrderSummary,
  SyncedCustomerSummary,
  SyncedEventSummary,
  SyncedSnapshotCounts,
  SyncedSiteSnapshot,
  SyncRun,
  SyncPersistenceWarning,
  SyncAuditEntry,
  SyncPersistenceResult,
} from './plugin/pluginReadModels';
export type { InMemoryPluginSyncRepository } from './plugin/pluginSyncRepository';
export {
  DEV_REPOSITORY_MAX_SNAPSHOTS,
  DEV_REPOSITORY_MAX_SYNC_RUNS,
  DEV_REPOSITORY_MAX_AUDIT_ENTRIES,
  createInMemoryPluginSyncRepository,
} from './plugin/pluginSyncRepository';
export type { BuildSyncAuditEntryInput } from './plugin/pluginSyncAudit';
export {
  SYNC_AUDIT_ACTIONS,
  auditActionForStatus,
  buildSyncAuditEntry,
} from './plugin/pluginSyncAudit';
export type {
  PluginSyncPersistenceContext,
  BuildReadModelsOptions,
  BuildSyncRunFromDeliveryOptions,
} from './plugin/pluginSyncPersistence';
export {
  buildReadModelsFromSnapshot,
  persistValidatedPluginSync,
  persistPluginEventBatch,
  buildSyncRunFromDeliveryResult,
} from './plugin/pluginSyncPersistence';
export type { PluginDeliveryPersistenceContext } from './plugin/pluginDeliveryResponse';

// Production database schema + tenant isolation DESIGN (design/contracts only; no real DB)
export type {
  RecordTimestamps,
  TenantRecord,
  PlatformUserRecord,
  TenantMembershipRecord,
  TenantMembershipStatus,
  SiteRecord,
  SiteConnectionRecord,
  SiteConnectionChannel,
  PluginConnectionRecord as DbPluginConnectionRecord,
  PluginConnectionStatus,
  CredentialMetadataRecord,
  SyncRunRecord,
  SyncRunDbStatus,
  SyncRunDbSource,
  SyncedProductRecord,
  SyncedOrderRecord,
  SyncedCustomerRecord,
  PluginEventRecord,
  SupportConversationRecord,
  SupportConversationStatus,
  SupportConversationChannel,
  SupportPriority,
  SupportMessageRecord,
  SupportMessageAuthorType,
  SupportInternalNoteRecord,
  SupportNoteSensitivity,
  SupportConversationContextSnapshot,
  WorkflowItemRecord,
  WorkflowItemType,
  WorkflowItemStatus,
  WorkflowEventRecord,
  WorkflowAssignmentRecord,
  SubscriptionRecord,
  SubscriptionStatus,
  PlanRecord,
  PlanSnapshot,
  UsageLimitRecord,
  UsageCounterRecord,
  UsageMetric,
  UsagePeriod,
  BillingEventRecord,
  BillingEventType,
  AuditLogRecord,
  SecuritySignalRecord,
  SecuritySignalType,
  SecuritySignalSeverity,
  AIUsageRecord,
  SmsUsageRecord,
  MediaGenerationUsageRecord,
  CampaignRecord,
  CampaignChannel,
  CampaignStatus,
  AutomationRuleRecord,
  SchemaTableName,
  SchemaTableDescriptor,
  SchemaScopingIssue,
  ReadModelMapping,
  SyncPersistenceBoundaries,
} from './database/schemaDesign';
export {
  SCHEMA_TABLES,
  getSchemaTableDescriptor,
  listAllSchemaTables,
  listRequiredTenantScopedTables,
  validateRecordScoping,
  describeReadModelToDatabaseMapping,
  describeSyncPersistenceBoundaries,
} from './database/schemaDesign';
export type { DataVisibilityLevel, PlatformRole, FieldVisibility } from './database/accessPolicy';
export {
  MERCHANT_ROLES,
  ROLE_VISIBILITY,
  FIELD_VISIBILITY,
  isMerchantRole,
  isSecretLevel,
  canRoleAccessVisibility,
  getFieldVisibility,
  findSecretNeverExposeFields,
  recordHoldsSecretField,
} from './database/accessPolicy';
export type {
  TenantIsolationMode,
  AccessScope,
  TenantScopedQueryContext,
  TenantAccessReason,
  TenantAccessDecision,
} from './database/tenantIsolation';
export {
  assertTenantScope,
  assertSiteScope,
  canAccessTenantRecord,
  canAccessSiteRecord,
  buildTenantScopedWhereClauseDescription,
} from './database/tenantIsolation';
export type {
  RetentionCategory,
  RetentionAction,
  RetentionPolicy,
  TenantDeletionBehavior,
  SiteDisconnectBehavior,
} from './database/dataRetention';
export {
  RETENTION_POLICIES,
  getRetentionPolicy,
  listRetentionCategories,
  TENANT_DELETION_BEHAVIOR,
  SITE_DISCONNECT_BEHAVIOR,
  AUDIT_PRESERVATION_RULES,
  DATA_SUBJECT_REQUESTS_LATER,
} from './database/dataRetention';
export type { ExampleResult as SchemaDesignExampleResult } from './database/schemaExamples';
export {
  collectSchemaDesignExampleResults,
  SCHEMA_DESIGN_EXAMPLE_RESULTS,
  ALL_SCHEMA_DESIGN_EXAMPLES_PASS,
} from './database/schemaExamples';
