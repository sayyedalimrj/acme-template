/**
 * Controlled DEV read-only sync persistence pipeline (backend skeleton).
 *
 * Pure pipeline that turns an ALREADY-VALIDATED/normalized sync envelope into normalized read
 * models and (optionally) stores them in the IN-MEMORY dev repository. It re-runs validation
 * defensively so raw PII / secrets / oversized payloads are rejected BEFORE anything is
 * stored. There is NO database, NO filesystem, NO network, and NO mutation of any store. The
 * default behavior never persists unless explicitly asked (and a repository is provided). See
 * `security-model.md`.
 */
import type { SiteId } from '../domain/site';
import type { TenantId } from '../domain/tenant';
import { ingestPluginEventBatch } from './pluginEventIngestor';
import type { PluginSyncEnvelope, PluginSyncIssue, SiteSyncSnapshot } from './pluginSyncEnvelope';
import { ingestPluginSyncEnvelope } from './pluginSyncIngestor';
import type {
  SyncAuditEntry,
  SyncedCustomerSummary,
  SyncedEventSummary,
  SyncedOrderSummary,
  SyncedProductSummary,
  SyncedSiteSnapshot,
  SyncedStoreSummary,
  SyncPersistenceResult,
  SyncPersistenceWarning,
  SyncRun,
  SyncSource,
} from './pluginReadModels';
import { SYNC_AUDIT_ACTIONS, buildSyncAuditEntry } from './pluginSyncAudit';
import type { InMemoryPluginSyncRepository } from './pluginSyncRepository';
import {
  DEFAULT_PLUGIN_DELIVERY_MODE,
  classifyValidationIssues,
  isPersistMode,
  type PluginDeliveryMode,
} from './pluginSyncState';
import { normalizePluginSyncPayload } from './pluginSyncValidator';
import type { PluginDeliveryResult } from './pluginDeliveryResponse';

// ---------------------------------------------------------------------------
// Safe coercion helpers (defensive; never throw, never leak unknown shapes).
// ---------------------------------------------------------------------------

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asId(value: unknown): string | number | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function toWarning(issue: PluginSyncIssue): SyncPersistenceWarning {
  return { code: issue.code, message: issue.message, path: issue.path };
}

function mapWarnings(issues: readonly PluginSyncIssue[]): SyncPersistenceWarning[] {
  return issues.map(toWarning);
}

// ---------------------------------------------------------------------------
// Read-model mapping (summary-only; camelCase with snake_case fallback).
// ---------------------------------------------------------------------------

function mapProduct(record: Record<string, unknown>): SyncedProductSummary {
  return {
    id: asId(record.id),
    name: asString(record.name),
    sku: asString(record.sku),
    status: asString(record.status),
    stockStatus: asString(record.stockStatus) ?? asString(record.stock_status),
    price: asString(record.price),
    type: asString(record.type),
  };
}

function mapOrder(record: Record<string, unknown>): SyncedOrderSummary {
  return {
    id: asId(record.id),
    number: asString(record.number),
    status: asString(record.status),
    currency: asString(record.currency),
    total: asString(record.total),
    itemCount: asNumber(record.itemCount) ?? asNumber(record.item_count),
    createdDate: asString(record.createdDate) ?? asString(record.created_date),
    customerLabel: asString(record.customerLabel) ?? asString(record.customer_label),
  };
}

function mapCustomer(record: Record<string, unknown>): SyncedCustomerSummary {
  return {
    id: asId(record.id),
    label: asString(record.label),
    orderCount: asNumber(record.orderCount) ?? asNumber(record.order_count),
    dateCreated: asString(record.dateCreated) ?? asString(record.date_created),
  };
}

function mapEvents(recent: Array<Record<string, unknown>> | undefined): SyncedEventSummary[] {
  if (!Array.isArray(recent)) {
    return [];
  }
  return recent.map((event) => ({
    eventType: asString(event.eventType) ?? asString(event.event_type),
    resourceType: asString(event.resourceType) ?? asString(event.resource_type),
    resourceId: asString(event.resourceId) ?? asString(event.resource_id),
    deliveryStatus: asString(event.deliveryStatus) ?? asString(event.delivery_status),
  }));
}

function buildStoreSummary(
  envelope: PluginSyncEnvelope,
  snapshot: SiteSyncSnapshot,
): SyncedStoreSummary {
  const raw = (envelope.payload?.storeSummary ?? {}) as Record<string, unknown>;
  return {
    wooCommerceActive: asBoolean(raw.woocommerce_active) ?? asBoolean(raw.wooCommerceActive),
    wooCommerceVersion:
      asString(raw.woocommerce_version) ?? asString(raw.wooCommerceVersion) ?? undefined,
    currency: asString(raw.currency) ?? undefined,
    healthOverall: snapshot.health?.overall,
  };
}

/** Resolve a stable, non-secret site key for the in-memory repository. */
function resolveSiteKey(snapshot: SiteSyncSnapshot): SiteId {
  return snapshot.siteId ?? snapshot.siteUrl ?? 'unknown_site';
}

// ---------------------------------------------------------------------------
// Id generation (deterministic-friendly; injectable for tests).
// ---------------------------------------------------------------------------

let idCounter = 0;

function defaultGenerateId(prefix: string, now: number): string {
  idCounter += 1;
  return `${prefix}_${now}_${idCounter}`;
}

/** Options for building read models from an in-memory snapshot. */
export interface BuildReadModelsOptions {
  source?: SyncSource;
  /** ISO-8601 timestamp for when the backend normalized/persisted this snapshot. */
  persistedAt?: string;
  store?: SyncedStoreSummary;
  events?: SyncedEventSummary[];
}

/**
 * Build normalized read models from an in-memory `SiteSyncSnapshot`. Pure. Events default to
 * an empty list (the base snapshot carries only an event count); callers may pass enriched
 * event summaries via `options.events`.
 */
export function buildReadModelsFromSnapshot(
  snapshot: SiteSyncSnapshot,
  options: BuildReadModelsOptions = {},
): SyncedSiteSnapshot {
  const products = (snapshot.products ?? []).map(mapProduct);
  const orders = (snapshot.orders ?? []).map(mapOrder);
  const customers = (snapshot.customers ?? []).map(mapCustomer);
  const events = options.events ?? [];

  return {
    siteId: resolveSiteKey(snapshot),
    tenantId: snapshot.tenantId,
    siteUrl: snapshot.siteUrl,
    pluginVersion: snapshot.pluginVersion,
    generatedAt: snapshot.generatedAt,
    persistedAt: options.persistedAt ?? snapshot.generatedAt,
    source: options.source ?? 'manual_ingest_dev',
    store: options.store ?? { healthOverall: snapshot.health?.overall },
    counts: {
      products: products.length,
      orders: orders.length,
      customers: customers.length,
      events: snapshot.counts?.events ?? 0,
    },
    products,
    orders,
    customers,
    events,
  };
}

/** Context for the persistence pipeline (all optional; safe defaults). */
export interface PluginSyncPersistenceContext {
  /** In-memory dev repository. When absent, nothing is ever persisted. */
  repository?: InMemoryPluginSyncRepository;
  /** Delivery mode. Defaults to `validate_only` (never persists). */
  mode?: PluginDeliveryMode;
  /** Origin label for runs/snapshots. */
  source?: SyncSource;
  /** Current time as ms epoch (injectable for deterministic tests). */
  now?: number;
  /** Site id for event-batch persistence (events carry no site reference of their own). */
  siteId?: SiteId;
  /** Tenant id for event-batch persistence. */
  tenantId?: TenantId;
  /** Optional id factory (injectable for deterministic tests). */
  generateId?: (prefix: string) => string;
}

/**
 * Validate + (optionally) persist a sync envelope as a normalized read-only snapshot.
 *
 * Steps: (1) validate/ingest defensively → reject raw PII/secrets/oversized before storing;
 * (2) map to read models; (3) when mode is `validate_and_persist_dev` AND a repository is
 * provided, save the snapshot + a sync run + an audit entry into memory; otherwise accept
 * without persisting. NO database, NO network, NO mutation.
 */
export function persistValidatedPluginSync(
  envelope: PluginSyncEnvelope | undefined,
  context: PluginSyncPersistenceContext = {},
): SyncPersistenceResult {
  const mode = context.mode ?? DEFAULT_PLUGIN_DELIVERY_MODE;
  const now = context.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const source = context.source ?? 'signed_delivery_dev';
  const newId = (prefix: string): string =>
    context.generateId ? context.generateId(prefix) : defaultGenerateId(prefix, now);

  const ingest = ingestPluginSyncEnvelope(envelope as PluginSyncEnvelope);
  const warnings = mapWarnings(ingest.validation.warnings);

  if (!ingest.accepted || !ingest.snapshot) {
    return {
      status: classifyValidationIssues(ingest.validation.errors),
      persisted: false,
      warnings,
    };
  }

  const snapshot = ingest.snapshot;
  const store = buildStoreSummary(envelope as PluginSyncEnvelope, snapshot);
  const events = mapEvents(
    normalizePluginSyncPayload((envelope as PluginSyncEnvelope).payload).events?.recent,
  );
  const readModel = buildReadModelsFromSnapshot(snapshot, {
    source,
    persistedAt: nowIso,
    store,
    events,
  });

  // validate_only OR no repository → accepted but NOT persisted.
  if (!isPersistMode(mode) || !context.repository) {
    return {
      status: 'accepted_not_persisted',
      persisted: false,
      siteId: readModel.siteId,
      snapshot: readModel,
      warnings,
    };
  }

  // validate_and_persist_dev → store in the in-memory dev repository only.
  const repository = context.repository;
  const savedSnapshot = repository.saveSiteSnapshot(readModel);

  const run: SyncRun = {
    id: newId('run'),
    siteId: readModel.siteId,
    tenantId: readModel.tenantId,
    source,
    status: 'accepted_persisted_dev',
    startedAt: nowIso,
    finishedAt: nowIso,
    counts: readModel.counts,
    warningCount: warnings.length,
    persisted: true,
  };
  repository.saveSyncRun(run);

  const audit: SyncAuditEntry = buildSyncAuditEntry({
    id: newId('audit'),
    siteId: readModel.siteId,
    tenantId: readModel.tenantId,
    status: 'accepted_persisted_dev',
    at: nowIso,
    detail: `Persisted dev snapshot: ${readModel.counts.products} products, ${readModel.counts.orders} orders, ${readModel.counts.customers} customers.`,
  });
  repository.saveAuditEntry(audit);

  return {
    status: 'accepted_persisted_dev',
    persisted: true,
    siteId: readModel.siteId,
    snapshot: savedSnapshot,
    run,
    audit,
    warnings,
  };
}

/**
 * Validate + (optionally) persist a summary-only event batch. Rejects batches with raw PII or
 * secrets before storing. When persisting in dev mode, records a sync run + audit entry only
 * (events do not form a site snapshot). NO database, NO network, NO mutation.
 */
export function persistPluginEventBatch(
  events: unknown,
  context: PluginSyncPersistenceContext = {},
): SyncPersistenceResult {
  const mode = context.mode ?? DEFAULT_PLUGIN_DELIVERY_MODE;
  const now = context.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const source = context.source ?? 'event_batch_dev';
  const siteId = context.siteId ?? 'unknown_site';
  const newId = (prefix: string): string =>
    context.generateId ? context.generateId(prefix) : defaultGenerateId(prefix, now);

  const ingest = ingestPluginEventBatch(events);
  const warnings = mapWarnings(ingest.validation.warnings);

  if (!ingest.accepted) {
    return {
      status: classifyValidationIssues(ingest.validation.errors),
      persisted: false,
      siteId,
      warnings,
    };
  }

  const counts = { products: 0, orders: 0, customers: 0, events: ingest.count };

  if (!isPersistMode(mode) || !context.repository) {
    return { status: 'accepted_not_persisted', persisted: false, siteId, warnings };
  }

  const repository = context.repository;
  const run: SyncRun = {
    id: newId('run'),
    siteId,
    tenantId: context.tenantId,
    source,
    status: 'accepted_persisted_dev',
    startedAt: nowIso,
    finishedAt: nowIso,
    counts,
    warningCount: warnings.length,
    persisted: true,
  };
  repository.saveSyncRun(run);

  const audit: SyncAuditEntry = buildSyncAuditEntry({
    id: newId('audit'),
    siteId,
    tenantId: context.tenantId,
    status: 'accepted_persisted_dev',
    at: nowIso,
    action: SYNC_AUDIT_ACTIONS.eventBatch,
    detail: `Persisted dev event batch: ${ingest.count} events.`,
  });
  repository.saveAuditEntry(audit);

  return { status: 'accepted_persisted_dev', persisted: true, siteId, run, audit, warnings };
}

/** Options for building a sync run from a delivery result. */
export interface BuildSyncRunFromDeliveryOptions {
  source?: SyncSource;
  now?: number;
  id?: string;
  siteId?: SiteId;
}

/**
 * Build a `SyncRun` record from a (handler) `PluginDeliveryResult`. Useful when a transport
 * wants to record a run regardless of whether persistence ran. Pure; never persists.
 */
export function buildSyncRunFromDeliveryResult(
  result: PluginDeliveryResult,
  options: BuildSyncRunFromDeliveryOptions = {},
): SyncRun {
  const now = options.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const source = options.source ?? 'signed_delivery_dev';
  const snapshot = result.snapshot;
  const siteId = snapshot?.siteId ?? snapshot?.siteUrl ?? options.siteId ?? 'unknown_site';
  const status =
    result.persistenceStatus ??
    (result.accepted ? 'accepted_not_persisted' : 'rejected_validation');
  const counts = snapshot
    ? {
        products: snapshot.counts.products,
        orders: snapshot.counts.orders,
        customers: snapshot.counts.customers,
        events: snapshot.counts.events,
      }
    : { products: 0, orders: 0, customers: 0, events: 0 };

  return {
    id: options.id ?? `run_${now}`,
    siteId,
    tenantId: snapshot?.tenantId,
    source,
    status,
    startedAt: nowIso,
    finishedAt: nowIso,
    counts,
    warningCount: result.warnings?.length ?? 0,
    persisted: status === 'accepted_persisted_dev',
  };
}
