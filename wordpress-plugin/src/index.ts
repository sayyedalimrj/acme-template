/**
 * Public barrel for the WordPress companion plugin contract.
 *
 * Re-exports the contract types and pure helpers. Dependency-free; no runtime, no network.
 * NOTE: neither `apps/client` nor `apps/api` should import from this package — it is a
 * contract sibling, not a runtime dependency.
 */

// Plugin metadata
export type { PluginMetadata, PluginSupportedFeature } from './plugin-metadata';
export { COMPANION_PLUGIN_METADATA } from './plugin-metadata';

// Site identity
export type {
  SiteId,
  TenantId,
  SiteIdentity,
  SiteIdentityVerificationStatus,
  WordPressEnvironment,
  WooCommerceEnvironment,
  SiteCapabilitySnapshot,
} from './site-identity';

// Handshake
export type {
  PluginConnectionIntent,
  PluginHandshakeRequest,
  PluginHandshakeResponse,
  PluginHandshakeStatus,
  PluginHandshakeChallenge,
  PluginHandshakeFailureReason,
} from './handshake-contract';

// Health check
export type {
  PluginHealthCheck,
  HealthCheckItem,
  HealthCheckId,
  HealthCheckSeverity,
  HealthCheckStatus,
} from './health-check-contract';
export { HEALTH_CHECK_DEFINITIONS } from './health-check-contract';

// Event bridge
export type {
  PluginEventEnvelope,
  PluginEventType,
  PluginEventSource,
  PluginEventPayloadSummary,
  PluginEventDeliveryStatus,
} from './event-bridge-contract';

// Webhook configuration
export type {
  WooWebhookConfigurationPlan,
  WooWebhookTopic,
  WooWebhookRegistrationStatus,
  WooWebhookDeliveryPolicy,
} from './webhook-config-contract';
export { DEFAULT_WEBHOOK_TOPICS } from './webhook-config-contract';

// Capabilities / permissions
export type {
  CompanionPluginCapability,
  CompanionPluginPermissionScope,
  RequiredWordPressCapability,
  RequiredWooCommerceCapability,
  CapabilityCheckResult,
  CapabilityDefinition,
} from './capabilities-contract';
export {
  CAPABILITY_DEFINITIONS,
  RESERVED_LATER_CAPABILITIES,
  isCapabilityEnabledByDefault,
  evaluateCapabilityPlaceholder,
} from './capabilities-contract';

// Disconnect / revoke
export type {
  DisconnectRequest,
  DisconnectResult,
  DisconnectStatus,
  RevokeReason,
  CleanupAction,
} from './disconnect-contract';
export { DISCONNECT_CLEANUP_PLAN } from './disconnect-contract';

// Redaction / diagnostics
export type { PluginDiagnosticReport, DiagnosticRedactionRule } from './redaction-contract';
export {
  REDACTED,
  DIAGNOSTIC_REDACTION_RULES,
  redactPluginDiagnosticText,
  diagnosticTextContainsSecret,
  buildSafeDiagnosticReport,
} from './redaction-contract';
