/**
 * Plugin sync ingestor (backend skeleton).
 *
 * Pure helpers that validate + normalize a sync envelope into an in-memory read-model
 * snapshot. They DO NOT write to any database and perform no network/persistence. Mapping
 * keeps only known safe fields (defensive against unknown/unsafe input). See `security-model.md`.
 */
import {
  type PluginSyncEnvelope,
  type PluginSyncIngestResult,
  type SiteSyncSnapshot,
} from './pluginSyncEnvelope';
import { normalizePluginSyncPayload, validatePluginSyncEnvelope } from './pluginSyncValidator';

/** Safe accessor for a string field on an unknown record. */
function pickString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

/** Safe accessor for a numeric field on an unknown record. */
function pickNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Map plugin product summaries to a safe read model (known fields only; no PII). */
export function mapPluginProductsToReadModel(
  products: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  if (!Array.isArray(products)) {
    return [];
  }
  return products.map((p) => ({
    id: pickNumber(p, 'id') ?? pickString(p, 'id') ?? null,
    name: pickString(p, 'name') ?? null,
    sku: pickString(p, 'sku') ?? null,
    status: pickString(p, 'status') ?? null,
    stockStatus: pickString(p, 'stock_status') ?? pickString(p, 'stockStatus') ?? null,
    price: pickString(p, 'price') ?? null,
    type: pickString(p, 'type') ?? null,
  }));
}

/** Map plugin order summaries to a safe read model (no PII; generic customer label only). */
export function mapPluginOrdersToReadModel(
  orders: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  if (!Array.isArray(orders)) {
    return [];
  }
  return orders.map((o) => ({
    id: pickNumber(o, 'id') ?? pickString(o, 'id') ?? null,
    number: pickString(o, 'number') ?? null,
    status: pickString(o, 'status') ?? null,
    currency: pickString(o, 'currency') ?? null,
    total: pickString(o, 'total') ?? null,
    itemCount: pickNumber(o, 'item_count') ?? pickNumber(o, 'itemCount') ?? null,
    createdDate: pickString(o, 'created_date') ?? pickString(o, 'createdDate') ?? null,
    customerLabel: pickString(o, 'customer_label') ?? pickString(o, 'customerLabel') ?? null,
  }));
}

/** Map plugin customer summaries to a safe read model (generic label only; no PII). */
export function mapPluginCustomersToReadModel(
  customers: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  if (!Array.isArray(customers)) {
    return [];
  }
  return customers.map((c) => ({
    id: pickNumber(c, 'id') ?? pickString(c, 'id') ?? null,
    label: pickString(c, 'label') ?? null,
    orderCount: pickNumber(c, 'order_count') ?? pickNumber(c, 'orderCount') ?? null,
    dateCreated: pickString(c, 'date_created') ?? pickString(c, 'dateCreated') ?? null,
  }));
}

/** Build an in-memory site sync snapshot from a (validated) envelope. No persistence. */
export function buildSiteSyncSnapshot(envelope: PluginSyncEnvelope): SiteSyncSnapshot {
  const payload = normalizePluginSyncPayload(envelope.payload);
  const products = mapPluginProductsToReadModel(payload.products);
  const orders = mapPluginOrdersToReadModel(payload.orders);
  const customers = mapPluginCustomersToReadModel(payload.customers);
  const eventCount = payload.events?.count ?? 0;

  return {
    siteId: payload.connection?.siteId,
    tenantId: payload.connection?.tenantId,
    generatedAt: envelope.generatedAt,
    pluginVersion: envelope.source?.pluginVersion ?? '',
    siteUrl: envelope.source?.siteUrl ?? '',
    counts: {
      products: products.length,
      orders: orders.length,
      customers: customers.length,
      events: eventCount,
    },
    products,
    orders,
    customers,
    health: payload.health,
  };
}

/**
 * Validate + ingest a sync envelope into an in-memory snapshot. Returns `accepted: false`
 * with validation errors when the payload is unsafe. NO database writes.
 */
export function ingestPluginSyncEnvelope(envelope: PluginSyncEnvelope): PluginSyncIngestResult {
  const validation = validatePluginSyncEnvelope(envelope);
  if (!validation.valid) {
    return { accepted: false, validation };
  }
  return { accepted: true, validation, snapshot: buildSiteSyncSnapshot(envelope) };
}
