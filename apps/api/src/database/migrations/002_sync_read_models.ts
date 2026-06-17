/**
 * Migration 002 — sync read-model tables (descriptor only; NO SQL, NO DB).
 *
 * Plans the normalized, SUMMARY-ONLY sync tables derived from validated plugin sync data.
 * Inert descriptor; nothing executed. Forbidden: raw WooCommerce objects, raw payload/meta,
 * addresses, phone, raw email, payment details, order notes. Raw customer PII appears only as
 * explicitly gated `*Restricted` columns. See `../schemaDesign.ts` + `security-model.md`.
 */
import {
  column,
  idColumn,
  siteIdColumn,
  syncRunIdColumn,
  tenantForeignKey,
  tenantIdColumn,
  tenantIndex,
  timestampColumns,
  type DatabaseMigration,
  type MigrationTable,
} from './migrationTypes';

const syncRuns: MigrationTable = {
  name: 'sync_runs',
  description: 'One row per sync attempt for a site (tenant + site scoped).',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    column('source', 'enum', {
      nullable: false,
      description: 'signed_delivery | manual | event_batch.',
    }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('startedAt', 'timestamptz', { nullable: false }),
    column('finishedAt', 'timestamptz'),
    column('productCount', 'integer', { nullable: false }),
    column('orderCount', 'integer', { nullable: false }),
    column('customerCount', 'integer', { nullable: false }),
    column('eventCount', 'integer', { nullable: false }),
    column('warningCount', 'integer', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('sync_runs'),
    { name: 'idx_sync_runs_site_started', columns: ['siteId', 'startedAt'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Sync run primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
  ],
};

const syncedProducts: MigrationTable = {
  name: 'synced_products',
  description: 'Summary-only synced products (tenant + site + sync scoped). No raw meta/images.',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: true,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    syncRunIdColumn(),
    column('externalId', 'varchar', { nullable: false, description: 'Source store product id.' }),
    column('name', 'text'),
    column('sku', 'varchar'),
    column('status', 'varchar'),
    column('stockStatus', 'varchar'),
    column('price', 'varchar', { description: 'Display price label only.' }),
    column('type', 'varchar'),
    column('syncedAt', 'timestamptz', { description: 'When this summary was synced.' }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('synced_products'),
    { name: 'idx_synced_products_site_ext', columns: ['siteId', 'externalId'] },
    { name: 'idx_synced_products_run', columns: ['syncRunId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Synced product primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
    {
      kind: 'foreign_key',
      columns: ['syncRunId'],
      references: 'sync_runs.id',
      description: 'Sync run FK.',
    },
  ],
};

const syncedOrders: MigrationTable = {
  name: 'synced_orders',
  description:
    'Summary-only synced orders (tenant + site + sync scoped). Generic customer label only.',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: true,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    syncRunIdColumn(),
    column('externalId', 'varchar', { nullable: false, description: 'Source store order id.' }),
    column('number', 'varchar'),
    column('status', 'varchar'),
    column('currency', 'varchar'),
    column('total', 'varchar', { description: 'Display total label only.' }),
    column('itemCount', 'integer'),
    column('orderedAt', 'timestamptz'),
    column('customerLabel', 'varchar', {
      description: 'Generic non-PII label (e.g. "Customer #7"). Never email/name/phone.',
    }),
    column('syncedCustomerId', 'uuid', { references: 'synced_customers.id' }),
    column('syncedAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('synced_orders'),
    { name: 'idx_synced_orders_site_ext', columns: ['siteId', 'externalId'] },
    { name: 'idx_synced_orders_run', columns: ['syncRunId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Synced order primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
    {
      kind: 'foreign_key',
      columns: ['syncRunId'],
      references: 'sync_runs.id',
      description: 'Sync run FK.',
    },
  ],
};

const syncedCustomers: MigrationTable = {
  name: 'synced_customers',
  description:
    'Summary-only synced customers (tenant + site + sync scoped). PII only in gated *Restricted columns.',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: true,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    syncRunIdColumn(),
    column('externalId', 'varchar', { nullable: false, description: 'Source store customer id.' }),
    column('label', 'varchar', { description: 'Generic/masked label only (default).' }),
    column('orderCount', 'integer'),
    column('firstSeenAt', 'timestamptz'),
    column('emailRestricted', 'text', {
      visibility: 'pii_restricted',
      description: 'Gated PII; empty by default, access-controlled and consent-bound.',
    }),
    column('phoneRestricted', 'varchar', {
      visibility: 'pii_restricted',
      description: 'Gated PII; empty by default, access-controlled and consent-bound.',
    }),
    column('syncedAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('synced_customers'),
    { name: 'idx_synced_customers_site_ext', columns: ['siteId', 'externalId'] },
    { name: 'idx_synced_customers_run', columns: ['syncRunId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Synced customer primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
    {
      kind: 'foreign_key',
      columns: ['syncRunId'],
      references: 'sync_runs.id',
      description: 'Sync run FK.',
    },
  ],
};

const pluginEvents: MigrationTable = {
  name: 'plugin_events',
  description: 'Summary-only plugin events (tenant + site scoped). Opaque references only; no PII.',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    syncRunIdColumn(true),
    column('eventType', 'varchar', { nullable: false }),
    column('resourceType', 'varchar'),
    column('resourceId', 'varchar', { description: 'Opaque resource reference; never PII.' }),
    column('deliveryStatus', 'varchar'),
    column('observedAt', 'timestamptz', { description: 'When the event was observed.' }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('plugin_events'),
    { name: 'idx_plugin_events_site_type', columns: ['siteId', 'eventType'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Plugin event primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
  ],
};

/** Migration 002 descriptor. */
export const migration002SyncReadModels: DatabaseMigration = {
  id: '002_sync_read_models',
  order: 2,
  title: 'Sync read-model tables',
  description:
    'Create normalized summary-only sync tables: sync_runs, synced_products, synced_orders, ' +
    'synced_customers, plugin_events. No raw WooCommerce objects, payload, meta, or PII.',
  status: 'planned',
  riskLevel: 'medium',
  tables: [syncRuns, syncedProducts, syncedOrders, syncedCustomers, pluginEvents],
  operations: [
    {
      kind: 'create_table',
      table: 'sync_runs',
      description: 'Create sync_runs.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'synced_products',
      description: 'Create synced_products.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'synced_orders',
      description: 'Create synced_orders.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'synced_customers',
      description: 'Create synced_customers.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'plugin_events',
      description: 'Create plugin_events.',
      reversible: true,
    },
    {
      kind: 'add_constraint',
      table: 'sites',
      description: 'Add sites.lastSyncRunId FK → sync_runs.id (now that sync_runs exists).',
      reversible: true,
    },
  ],
  tenantScopingImpact:
    'All sync tables carry tenantId + siteId; product/order/customer rows also carry syncRunId. ' +
    'Every read is scoped to the owning tenant + site.',
  rollback: {
    reversible: true,
    strategy: 'drop_created_objects',
    requiresManualApproval: false,
    requiresBackup: true,
    tenantAware: true,
    steps: ['Drop the sites.lastSyncRunId FK.', 'Drop sync tables in reverse dependency order.'],
    notes: 'Synced rows are reproducible from a fresh sync; still back up before applying.',
  },
  safetyChecks: [
    {
      id: '002-scope',
      category: 'tenant_isolation',
      severity: 'blocking',
      description:
        'Every sync table includes tenantId + siteId; product/order/customer include syncRunId.',
    },
    {
      id: '002-no-raw-payload',
      category: 'data_integrity',
      severity: 'blocking',
      description: 'No raw payload/meta/object columns; only normalized summary fields.',
    },
    {
      id: '002-no-raw-pii',
      category: 'no_raw_pii',
      severity: 'blocking',
      description: 'No address/phone/email except explicitly gated *Restricted customer columns.',
    },
    {
      id: '002-validated-before-persist',
      category: 'data_integrity',
      severity: 'blocking',
      description:
        'Rows are written only from sync data that passed signature/PII/secret/cap validation.',
    },
  ],
};
