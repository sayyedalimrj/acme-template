/**
 * Migration 003 — support, workflows, subscriptions/usage/billing (descriptor only; NO SQL/DB).
 *
 * Plans the support, workflow, and subscription/usage/billing tables. Inert descriptor.
 * Rules: all tenant-scoped (except the global `plans` table); NO payment card data (provider
 * refs are restricted metadata only); raw PII restricted; support context is summary-only by
 * default. See `../schemaDesign.ts` + `security-model.md`.
 */
import {
  column,
  idColumn,
  siteIdColumn,
  tenantForeignKey,
  tenantIdColumn,
  tenantIndex,
  timestampColumns,
  type DatabaseMigration,
  type MigrationTable,
} from './migrationTypes';

const supportConversations: MigrationTable = {
  name: 'support_conversations',
  description: 'Support / internal-request conversations (tenant-scoped; site optional).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('subject', 'text', { nullable: false }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('channel', 'enum', { nullable: false }),
    column('priority', 'enum'),
    column('assignedToUserId', 'uuid', { references: 'platform_users.id' }),
    column('lastMessageAt', 'timestamptz'),
    column('contextSnapshotId', 'uuid', { references: 'support_context_snapshots.id' }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('support_conversations'),
    { name: 'idx_support_conv_status', columns: ['status'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Conversation primary key.' },
    tenantForeignKey(),
  ],
};

const supportMessages: MigrationTable = {
  name: 'support_messages',
  description: 'Messages within a conversation (tenant-scoped). Redacted on write; no secrets.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('conversationId', 'uuid', { nullable: false, references: 'support_conversations.id' }),
    column('authorType', 'enum', { nullable: false }),
    column('authorUserId', 'uuid', { references: 'platform_users.id' }),
    column('body', 'text', {
      nullable: false,
      description: 'Redacted message body; never secrets.',
    }),
    column('internalOnly', 'boolean', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('support_messages'),
    { name: 'idx_support_msg_conv', columns: ['conversationId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Message primary key.' },
    tenantForeignKey(),
    {
      kind: 'foreign_key',
      columns: ['conversationId'],
      references: 'support_conversations.id',
      description: 'Conversation FK.',
    },
  ],
};

const supportInternalNotes: MigrationTable = {
  name: 'support_internal_notes',
  description: 'Internal staff notes (tenant-scoped); support_safe or security_restricted.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('conversationId', 'uuid', { nullable: false, references: 'support_conversations.id' }),
    column('authorUserId', 'uuid', { nullable: false, references: 'platform_users.id' }),
    column('body', 'text', {
      nullable: false,
      visibility: 'support_safe',
      description: 'Never secrets.',
    }),
    column('sensitivity', 'enum', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('support_internal_notes')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Internal note primary key.' },
    tenantForeignKey(),
  ],
};

const supportContextSnapshots: MigrationTable = {
  name: 'support_context_snapshots',
  description: 'Summary-only conversation context (tenant-scoped). No PII/secrets.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('conversationId', 'uuid', { nullable: false, references: 'support_conversations.id' }),
    siteIdColumn(true),
    column('planLabel', 'varchar', { visibility: 'support_safe' }),
    column('siteStatus', 'enum', { visibility: 'support_safe' }),
    column('productCount', 'integer'),
    column('orderCount', 'integer'),
    column('summaryOnly', 'boolean', {
      nullable: false,
      description: 'Always true; summary-only guarantee.',
    }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('support_context_snapshots')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Context snapshot primary key.' },
    tenantForeignKey(),
  ],
};

const workflowItems: MigrationTable = {
  name: 'workflow_items',
  description: 'Internal operations board items (tenant-scoped; site optional).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('type', 'enum', { nullable: false }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('title', 'text', { nullable: false }),
    column('priority', 'enum'),
    column('assignedToUserId', 'uuid', { references: 'platform_users.id' }),
    column('dueAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('workflow_items'),
    { name: 'idx_workflow_items_status', columns: ['status'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Workflow item primary key.' },
    tenantForeignKey(),
  ],
};

const workflowEvents: MigrationTable = {
  name: 'workflow_events',
  description: 'Workflow transitions (tenant-scoped).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('workflowItemId', 'uuid', { nullable: false, references: 'workflow_items.id' }),
    column('eventType', 'varchar', { nullable: false }),
    column('fromStatus', 'enum'),
    column('toStatus', 'enum'),
    column('actorUserId', 'uuid', { references: 'platform_users.id' }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('workflow_events'),
    { name: 'idx_workflow_events_item', columns: ['workflowItemId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Workflow event primary key.' },
    tenantForeignKey(),
    {
      kind: 'foreign_key',
      columns: ['workflowItemId'],
      references: 'workflow_items.id',
      description: 'Workflow item FK.',
    },
  ],
};

const workflowAssignments: MigrationTable = {
  name: 'workflow_assignments',
  description: 'Workflow assignments (tenant-scoped).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('workflowItemId', 'uuid', { nullable: false, references: 'workflow_items.id' }),
    column('assignedToUserId', 'uuid', { nullable: false, references: 'platform_users.id' }),
    column('assignedByUserId', 'uuid', { references: 'platform_users.id' }),
    column('unassignedAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('workflow_assignments')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Workflow assignment primary key.' },
    tenantForeignKey(),
  ],
};

const plans: MigrationTable = {
  name: 'plans',
  description: 'Global plan definitions / entitlements (NOT tenant-scoped). No payment data.',
  tenantScoped: false,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    column('key', 'enum', { nullable: false, visibility: 'public_safe' }),
    column('displayName', 'text', { nullable: false, visibility: 'public_safe' }),
    column('entitlements', 'jsonb_safe', { description: 'Non-secret entitlement flags/limits.' }),
    column('priceLabel', 'varchar', {
      visibility: 'public_safe',
      description: 'Display label only; no payment data.',
    }),
    ...timestampColumns(),
  ],
  indexes: [{ name: 'uniq_plans_key', columns: ['key'], unique: true }],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Plan primary key.' },
    { kind: 'unique', columns: ['key'], description: 'One row per plan key.' },
  ],
};

const subscriptions: MigrationTable = {
  name: 'subscriptions',
  description:
    'Tenant subscriptions (tenant-scoped). Provider refs are billing_restricted; no card data.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('planId', 'uuid', { nullable: false, references: 'plans.id' }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('currentPeriodStart', 'timestamptz'),
    column('currentPeriodEnd', 'timestamptz'),
    column('cancelAt', 'timestamptz'),
    column('providerCustomerRef', 'varchar', {
      visibility: 'billing_restricted',
      description: 'Provider customer reference. NO card/PAN data, ever.',
    }),
    column('providerSubscriptionRef', 'varchar', {
      visibility: 'billing_restricted',
      description: 'Provider subscription reference.',
    }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('subscriptions')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Subscription primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['planId'], references: 'plans.id', description: 'Plan FK.' },
  ],
};

const usageLimits: MigrationTable = {
  name: 'usage_limits',
  description: 'Per-tenant usage limits (tenant-scoped).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('metric', 'enum', { nullable: false }),
    column('limit', 'integer', { nullable: false }),
    column('period', 'enum', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('usage_limits'),
    { name: 'uniq_usage_limit', columns: ['tenantId', 'metric', 'period'], unique: true },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Usage limit primary key.' },
    tenantForeignKey(),
  ],
};

const usageCounters: MigrationTable = {
  name: 'usage_counters',
  description: 'Per-tenant usage counters (tenant-scoped).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('metric', 'enum', { nullable: false }),
    column('periodStart', 'timestamptz', { nullable: false }),
    column('periodEnd', 'timestamptz', { nullable: false }),
    column('used', 'integer', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('usage_counters'),
    { name: 'idx_usage_counter_metric', columns: ['tenantId', 'metric'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Usage counter primary key.' },
    tenantForeignKey(),
  ],
};

const billingEvents: MigrationTable = {
  name: 'billing_events',
  description: 'Billing events (tenant-scoped). Invoice METADATA only; no card data.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('subscriptionId', 'uuid', { references: 'subscriptions.id' }),
    column('type', 'enum', { nullable: false }),
    column('amountLabel', 'varchar', {
      visibility: 'billing_restricted',
      description: 'Display amount label only (e.g. "$29.00"). Never a PAN or card detail.',
    }),
    column('currency', 'varchar'),
    column('providerEventRef', 'varchar', { visibility: 'billing_restricted' }),
    column('occurredAt', 'timestamptz', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('billing_events'),
    { name: 'idx_billing_events_sub', columns: ['subscriptionId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Billing event primary key.' },
    tenantForeignKey(),
  ],
};

/** Migration 003 descriptor. */
export const migration003SupportWorkflowsBilling: DatabaseMigration = {
  id: '003_support_workflows_billing',
  order: 3,
  title: 'Support, workflows, subscriptions/usage/billing tables',
  description:
    'Create support_conversations, support_messages, support_internal_notes, ' +
    'support_context_snapshots, workflow_items, workflow_events, workflow_assignments, ' +
    'plans, subscriptions, usage_limits, usage_counters, billing_events.',
  status: 'planned',
  riskLevel: 'medium',
  tables: [
    supportConversations,
    supportMessages,
    supportInternalNotes,
    supportContextSnapshots,
    workflowItems,
    workflowEvents,
    workflowAssignments,
    plans,
    subscriptions,
    usageLimits,
    usageCounters,
    billingEvents,
  ],
  operations: [
    {
      kind: 'create_table',
      table: 'support_conversations',
      description: 'Create support_conversations.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'support_messages',
      description: 'Create support_messages.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'support_internal_notes',
      description: 'Create support_internal_notes.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'support_context_snapshots',
      description: 'Create support_context_snapshots.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'workflow_items',
      description: 'Create workflow_items.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'workflow_events',
      description: 'Create workflow_events.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'workflow_assignments',
      description: 'Create workflow_assignments.',
      reversible: true,
    },
    { kind: 'create_table', table: 'plans', description: 'Create plans.', reversible: true },
    {
      kind: 'create_table',
      table: 'subscriptions',
      description: 'Create subscriptions.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'usage_limits',
      description: 'Create usage_limits.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'usage_counters',
      description: 'Create usage_counters.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'billing_events',
      description: 'Create billing_events.',
      reversible: true,
    },
  ],
  tenantScopingImpact:
    'All tables are tenant-scoped except the global `plans` table. Support context snapshots ' +
    'are summary-only; billing rows hold provider metadata only (no card data).',
  rollback: {
    reversible: true,
    strategy: 'drop_created_objects',
    requiresManualApproval: false,
    requiresBackup: true,
    tenantAware: true,
    steps: [
      'Drop tables in reverse dependency order (billing_events → … → support_conversations).',
      'No destructive data transform; clean structural rollback.',
    ],
  },
  safetyChecks: [
    {
      id: '003-tenant-scope',
      category: 'tenant_isolation',
      severity: 'blocking',
      description: 'All tables tenant-scoped except global plans; support context is summary-only.',
    },
    {
      id: '003-no-card-data',
      category: 'no_raw_secret',
      severity: 'blocking',
      description:
        'No payment card columns; subscriptions/billing store provider metadata refs only.',
    },
    {
      id: '003-no-secret-in-messages',
      category: 'no_raw_secret',
      severity: 'blocking',
      description: 'Support messages/notes are redacted on write and never store secrets.',
    },
    {
      id: '003-reversible',
      category: 'reversibility',
      severity: 'info',
      description: 'Structural-only; reversible by dropping created objects.',
    },
  ],
};
