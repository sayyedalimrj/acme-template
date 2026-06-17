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
  buildSignatureBaseString,
  verifyPluginSignaturePlaceholder,
} from './plugin/pluginSignature';
export {
  registerPluginConnectionPlaceholder,
  getPluginConnectionStatus,
  disconnectPluginConnectionPlaceholder,
  resetPluginConnectionRegistry,
} from './plugin/pluginConnectionRegistry';
export type { RegisterPluginConnectionInput } from './plugin/pluginConnectionRegistry';
