/**
 * Plugin sync fixtures (backend skeleton).
 *
 * Safe, secret-free, PII-free fixtures for examples/tests. Uses the reserved example domain
 * `example-store.test`, generic customer labels, and obviously-fake placeholders only. The
 * "invalid" builders intentionally inject an unsafe field to prove the validators reject it.
 */
import {
  MAX_SYNC_RESOURCE_RECORDS,
  PLUGIN_SYNC_SCHEMA_VERSION,
  type PluginSyncEnvelope,
} from './pluginSyncEnvelope';

/** A valid, safe sync envelope (no PII, no secrets). */
export function buildValidSyncEnvelope(): PluginSyncEnvelope {
  return {
    schemaVersion: PLUGIN_SYNC_SCHEMA_VERSION,
    generatedAt: '2026-06-17T08:00:00.000Z',
    source: {
      plugin: 'wordpress-commerce-os-companion',
      pluginVersion: '0.3.0',
      siteUrl: 'https://example-store.test',
      homeUrl: 'https://example-store.test',
    },
    payload: {
      connection: {
        siteId: 'site_local_demo',
        tenantId: 'tenant_local_demo',
        status: 'local_ready',
        mode: 'local',
        backendConnected: false,
      },
      storeSummary: { woocommerce_active: true, woocommerce_version: '8.9' },
      products: [
        {
          id: 101,
          name: 'Demo Tee',
          sku: 'TEE-1',
          status: 'publish',
          stock_status: 'instock',
          price: '19.90',
          type: 'simple',
        },
        {
          id: 102,
          name: 'Demo Mug',
          sku: 'MUG-1',
          status: 'publish',
          stock_status: 'instock',
          price: '9.50',
          type: 'simple',
        },
      ],
      orders: [
        {
          id: 5001,
          number: '5001',
          status: 'processing',
          currency: 'USD',
          total: '29.40',
          item_count: 2,
          created_date: '2026-06-16',
          customer_label: 'Customer #7',
        },
      ],
      customers: [{ id: 7, label: 'Customer #7', order_count: 3, date_created: '2026-01-02' }],
      events: {
        count: 1,
        recent: [
          {
            event_type: 'order.created',
            resource_type: 'order',
            resource_id: '5001',
            delivery_status: 'local_only',
          },
        ],
      },
      health: { overall: 'ok' },
    },
    signature: { algorithm: 'none', status: 'not_configured' },
  };
}

/** Variant: injects an email-shaped value (must be rejected). Reserved example domain only. */
export function buildSyncEnvelopeWithRawEmail(): PluginSyncEnvelope {
  const envelope = buildValidSyncEnvelope();
  envelope.payload.customers = [
    { id: 7, label: 'Customer #7', contact: 'nobody@example-store.test' },
  ];
  return envelope;
}

/** Variant: injects a PII phone field (must be rejected). */
export function buildSyncEnvelopeWithRawPhone(): PluginSyncEnvelope {
  const envelope = buildValidSyncEnvelope();
  envelope.payload.customers = [{ id: 7, label: 'Customer #7', phone: '0000000000' }];
  return envelope;
}

/** Variant: injects a secret-like field (must be rejected). Value is a benign placeholder. */
export function buildSyncEnvelopeWithSecret(): PluginSyncEnvelope {
  const envelope = buildValidSyncEnvelope();
  (envelope.payload.storeSummary as Record<string, unknown>).consumerSecret = 'placeholder-value';
  return envelope;
}

/** Variant: oversized product list (must be flagged). */
export function buildSyncEnvelopeWithOversizeProducts(): PluginSyncEnvelope {
  const envelope = buildValidSyncEnvelope();
  envelope.payload.products = Array.from(
    { length: MAX_SYNC_RESOURCE_RECORDS + 5 },
    (_unused, i) => ({
      id: 1000 + i,
      name: `Product ${i}`,
      sku: `SKU-${i}`,
      status: 'publish',
    }),
  );
  return envelope;
}

/** A valid, safe event batch (no PII, no secrets). */
export function buildValidEventBatch(): Array<Record<string, unknown>> {
  return [
    {
      event_type: 'order.created',
      resource_type: 'order',
      resource_id: '5001',
      delivery_status: 'local_only',
    },
    {
      event_type: 'product.stock_changed',
      resource_type: 'product',
      resource_id: '101',
      delivery_status: 'local_only',
    },
  ];
}
