/**
 * Plugin read-only sync envelope contracts (backend skeleton).
 *
 * Backend-side types for the read-only sync package + event batch produced by the WordPress
 * companion plugin. These are CONTRACTS only — there is no transport, no persistence, and no
 * delivery here. Payloads are summary-only and must never carry raw PII or secrets (enforced
 * by `pluginSyncValidator`). Names are kept compatible with the plugin's package by
 * convention (the plugin emits snake_case JSON; a mapping layer arrives with real delivery).
 * See `security-model.md`.
 */
import type { SiteConnectionCapability, SiteId } from '../domain/site';
import type { TenantId } from '../domain/tenant';

/** Schema version string for the sync envelope. */
export const PLUGIN_SYNC_SCHEMA_VERSION = 'wcos.sync.v1';

/** Hard cap on records per resource list the backend will accept. */
export const MAX_SYNC_RESOURCE_RECORDS = 50;

/** Hard cap on events per ingest batch. */
export const MAX_SYNC_EVENT_RECORDS = 100;

/** Where a sync package came from (non-secret identity). */
export interface PluginSyncSource {
  /** Always the single companion plugin slug. */
  plugin: string;
  pluginVersion: string;
  /** Public site URL (non-secret). */
  siteUrl: string;
  homeUrl?: string;
}

/** Non-secret connection metadata included in a sync package. */
export interface PluginSyncConnection {
  siteId?: SiteId;
  tenantId?: TenantId;
  status?: string;
  mode?: string;
  backendConnected?: boolean;
}

/** A summarized resource list (products/orders/customers). Items are opaque, summary-only. */
export interface PluginSyncResourceSummary {
  type: 'product' | 'order' | 'customer';
  count: number;
  items: Array<Record<string, unknown>>;
}

/** The read-only payload of a sync package. Summary-only; no raw PII/secrets. */
export interface PluginSyncPayload {
  connection?: PluginSyncConnection;
  storeSummary?: Record<string, unknown>;
  products: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  customers: Array<Record<string, unknown>>;
  events?: {
    count: number;
    recent: Array<Record<string, unknown>>;
  };
  health?: { overall: string };
}

/** Placeholder signature block. No real secret/signature material is ever present. */
export interface PluginSignatureBlock {
  /** Always "none" in this phase. */
  algorithm: string;
  /** Always "not_configured" in this phase. */
  status: 'not_configured' | 'invalid' | 'valid';
}

/** The full sync envelope sent (in a future phase) from plugin → backend. */
export interface PluginSyncEnvelope {
  schemaVersion: string;
  /** ISO-8601 timestamp. */
  generatedAt: string;
  source: PluginSyncSource;
  payload: PluginSyncPayload;
  signature?: PluginSignatureBlock;
}

/** Outcome of validating/ingesting — see `pluginSyncValidator` / `pluginSyncIngestor`. */
export interface PluginSyncIssue {
  code: string;
  message: string;
  /** Dot/array path where the issue was found (no values included). */
  path?: string;
}

/** Result of validating a sync envelope/payload. */
export interface PluginSyncValidationResult {
  valid: boolean;
  errors: PluginSyncIssue[];
  warnings: PluginSyncIssue[];
}

/** Delivery status mirrored from the plugin (read-only, never enables real delivery here). */
export type PluginDeliveryStatus =
  | 'not_configured'
  | 'disabled'
  | 'local_preview_only'
  | 'configured_later';

/** Result of verifying a plugin signature (always not_configured in this phase). */
export interface PluginSignatureVerificationResult {
  verified: boolean;
  status: 'not_configured' | 'invalid' | 'valid';
  algorithm: string;
  /** Safe, non-secret reason. */
  reason?: string;
}

/** Read-model snapshot the backend builds in-memory from a valid envelope (no persistence). */
export interface SiteSyncSnapshot {
  siteId?: SiteId;
  tenantId?: TenantId;
  generatedAt: string;
  pluginVersion: string;
  siteUrl: string;
  counts: { products: number; orders: number; customers: number; events: number };
  products: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  customers: Array<Record<string, unknown>>;
  health?: { overall: string };
}

/** Result of ingesting a sync envelope (in-memory only; no DB writes). */
export interface PluginSyncIngestResult {
  accepted: boolean;
  validation: PluginSyncValidationResult;
  snapshot?: SiteSyncSnapshot;
}

/** Result of ingesting an event batch (in-memory only). */
export interface PluginEventIngestResult {
  accepted: boolean;
  validation: PluginSyncValidationResult;
  count: number;
  events: Array<Record<string, unknown>>;
}

/** Connection registry record (metadata only — never any secret). */
export interface PluginConnectionRecord {
  tenantId?: TenantId;
  siteId: SiteId;
  pluginVersion: string;
  siteUrl: string;
  connectionStatus: string;
  deliveryStatus: PluginDeliveryStatus;
  lastSyncAt?: string;
  capabilities: SiteConnectionCapability[];
}
