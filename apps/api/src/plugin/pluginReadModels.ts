/**
 * Backend read models for synced data (backend skeleton).
 *
 * Normalized, SUMMARY-ONLY read models the backend builds from a validated plugin sync
 * envelope. These are deliberately minimal: NO raw WooCommerce objects, NO raw PII (no
 * addresses, phone, raw email), NO payment details, NO order notes, NO raw meta, NO secrets.
 * Customer/order references are generic labels only. These types describe an IN-MEMORY,
 * development-only read snapshot — there is no database schema here. See `security-model.md`.
 */
import type { SiteId } from '../domain/site';
import type { TenantId } from '../domain/tenant';
import type { PluginSyncPersistenceStatus } from './pluginSyncState';

/** Where a persisted snapshot/run originated (non-secret, dev-only labels). */
export type SyncSource = 'signed_delivery_dev' | 'manual_ingest_dev' | 'event_batch_dev';

/** Status of a recorded sync run (mirrors the persistence status union). */
export type SyncRunStatus = PluginSyncPersistenceStatus;

/** Normalized, non-secret store-level summary. */
export interface SyncedStoreSummary {
  wooCommerceActive?: boolean;
  wooCommerceVersion?: string;
  currency?: string;
  /** Overall health label (e.g. ok / warning / error / unknown). */
  healthOverall?: string;
}

/** Normalized product summary (no raw meta, no images, no descriptions). */
export interface SyncedProductSummary {
  id: string | number | null;
  name: string | null;
  sku: string | null;
  status: string | null;
  stockStatus: string | null;
  price: string | null;
  type: string | null;
}

/** Normalized order summary (generic customer label only; no PII, no line items, no notes). */
export interface SyncedOrderSummary {
  id: string | number | null;
  number: string | null;
  status: string | null;
  currency: string | null;
  total: string | null;
  itemCount: number | null;
  createdDate: string | null;
  /** Generic, non-PII label (e.g. "Customer #7"). Never an email/name/phone. */
  customerLabel: string | null;
}

/** Normalized customer summary (generic/masked label only; no PII). */
export interface SyncedCustomerSummary {
  id: string | number | null;
  /** Generic or masked label only. Never a raw email/name/phone/address. */
  label: string | null;
  orderCount: number | null;
  dateCreated: string | null;
}

/** Normalized event summary (no PII; opaque references only). */
export interface SyncedEventSummary {
  eventType: string | null;
  resourceType: string | null;
  resourceId: string | null;
  deliveryStatus: string | null;
}

/** Counts of normalized records in a snapshot. */
export interface SyncedSnapshotCounts {
  products: number;
  orders: number;
  customers: number;
  events: number;
}

/** A normalized, read-only site snapshot (in-memory, dev-only; not a DB row). */
export interface SyncedSiteSnapshot {
  siteId: SiteId;
  tenantId?: TenantId;
  siteUrl: string;
  pluginVersion: string;
  /** When the plugin generated the package (ISO-8601). */
  generatedAt: string;
  /** When the backend normalized/persisted this snapshot in dev (ISO-8601). */
  persistedAt: string;
  source: SyncSource;
  store: SyncedStoreSummary;
  counts: SyncedSnapshotCounts;
  products: SyncedProductSummary[];
  orders: SyncedOrderSummary[];
  customers: SyncedCustomerSummary[];
  events: SyncedEventSummary[];
}

/** A record of a single sync attempt (accepted/persisted or rejected). */
export interface SyncRun {
  id: string;
  siteId: SiteId;
  tenantId?: TenantId;
  source: SyncSource;
  status: SyncRunStatus;
  /** ISO-8601 timestamps. */
  startedAt: string;
  finishedAt: string;
  counts: SyncedSnapshotCounts;
  warningCount: number;
  /** True only when the snapshot was stored in the in-memory dev repository. */
  persisted: boolean;
}

/** A safe, non-secret warning surfaced during persistence. */
export interface SyncPersistenceWarning {
  code: string;
  message: string;
  /** Dot/array path (no values included). */
  path?: string;
}

/** A summary-only audit entry for a sync attempt (no PII, no secrets, no raw bodies). */
export interface SyncAuditEntry {
  id: string;
  siteId: SiteId;
  tenantId?: TenantId;
  /** Stable audit action label (e.g. plugin.sync.persisted.dev). */
  action: string;
  status: SyncRunStatus;
  /** ISO-8601 timestamp. */
  at: string;
  /** Short, safe, non-secret detail. */
  detail?: string;
}

/** Result of attempting to persist a validated sync envelope (in-memory dev only). */
export interface SyncPersistenceResult {
  status: PluginSyncPersistenceStatus;
  /** True only when a snapshot was stored in the in-memory dev repository. */
  persisted: boolean;
  siteId?: SiteId;
  /** Present when accepted (normalized read model). */
  snapshot?: SyncedSiteSnapshot;
  /** Present when persisted in dev mode. */
  run?: SyncRun;
  /** Present when persisted in dev mode. */
  audit?: SyncAuditEntry;
  warnings: SyncPersistenceWarning[];
}
