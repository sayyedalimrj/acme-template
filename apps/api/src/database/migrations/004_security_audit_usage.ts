/**
 * Migration 004 — security, audit, and usage/growth tables (descriptor only; NO SQL/DB).
 *
 * Plans audit_logs, security_signals, and the future usage/growth tables. Inert descriptor.
 * Rules: NO raw secrets / NO secret payload storage; audit details are redacted; security
 * signals store safe summaries only; usage counters are tenant/site scoped. See
 * `../schemaDesign.ts` + `security-model.md`.
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

const auditLogs: MigrationTable = {
  name: 'audit_logs',
  description:
    'Privileged-action audit log (tenant-scoped where applicable). Redacted details only.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('actorType', 'enum', { nullable: false }),
    column('actorUserId', 'uuid', { references: 'platform_users.id' }),
    column('actorRole', 'enum'),
    column('action', 'varchar', { nullable: false }),
    column('targetType', 'varchar'),
    column('targetId', 'varchar'),
    column('riskLevel', 'enum', { nullable: false, visibility: 'security_restricted' }),
    column('details', 'jsonb_safe', {
      visibility: 'security_restricted',
      description: 'Redacted, non-secret context only (secrets/PII never stored here).',
    }),
    column('at', 'timestamptz', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('audit_logs'),
    { name: 'idx_audit_logs_action_at', columns: ['action', 'at'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Audit log primary key.' },
    tenantForeignKey(),
  ],
};

const securitySignals: MigrationTable = {
  name: 'security_signals',
  description:
    'Security signals (tenant-scoped where applicable). Safe summaries only; no raw value.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('type', 'enum', { nullable: false, visibility: 'security_restricted' }),
    column('severity', 'enum', { nullable: false, visibility: 'security_restricted' }),
    column('summary', 'text', {
      nullable: false,
      visibility: 'security_restricted',
      description: 'Safe, non-secret summary. Never includes the offending secret/PII value.',
    }),
    column('sourceRunId', 'uuid', { references: 'sync_runs.id' }),
    column('detectedAt', 'timestamptz', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('security_signals'),
    { name: 'idx_security_signals_type', columns: ['type'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Security signal primary key.' },
    tenantForeignKey(),
  ],
};

const aiUsage: MigrationTable = {
  name: 'ai_usage',
  description: 'AI feature usage (tenant-scoped; site optional). Future phase.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('feature', 'varchar', { nullable: false }),
    column('inputUnits', 'integer', {
      description: 'Model input token-unit count (not a secret).',
    }),
    column('outputUnits', 'integer', {
      description: 'Model output token-unit count (not a secret).',
    }),
    column('providerRef', 'varchar', { visibility: 'billing_restricted' }),
    column('occurredAt', 'timestamptz', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('ai_usage')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'AI usage primary key.' },
    tenantForeignKey(),
  ],
};

const smsUsage: MigrationTable = {
  name: 'sms_usage',
  description:
    'SMS usage (tenant-scoped; site optional). Future phase. Recipient is an opaque ref.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('campaignId', 'uuid', { references: 'campaigns.id' }),
    column('segments', 'integer', { nullable: false }),
    column('recipientRef', 'varchar', {
      visibility: 'pii_restricted',
      description: 'Opaque/hashed recipient reference. NEVER a raw phone number.',
    }),
    column('status', 'varchar'),
    column('occurredAt', 'timestamptz', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('sms_usage')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'SMS usage primary key.' },
    tenantForeignKey(),
  ],
};

const mediaGenerationUsage: MigrationTable = {
  name: 'media_generation_usage',
  description: 'AI media-generation usage (tenant-scoped; site optional). Future phase.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('taskType', 'varchar', { nullable: false }),
    column('outputCount', 'integer', { nullable: false }),
    column('providerRef', 'varchar', { visibility: 'billing_restricted' }),
    column('occurredAt', 'timestamptz', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('media_generation_usage')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Media generation usage primary key.' },
    tenantForeignKey(),
  ],
};

const campaigns: MigrationTable = {
  name: 'campaigns',
  description: 'Marketing campaigns (tenant-scoped; site optional). Future phase.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('name', 'text', { nullable: false }),
    column('channel', 'enum', { nullable: false }),
    column('status', 'enum', { nullable: false }),
    column('scheduledAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('campaigns')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Campaign primary key.' },
    tenantForeignKey(),
  ],
};

const automationRules: MigrationTable = {
  name: 'automation_rules',
  description: 'Automation rules (tenant-scoped; site optional). Future phase.',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(true),
    column('trigger', 'varchar', { nullable: false }),
    column('action', 'varchar', { nullable: false }),
    column('enabled', 'boolean', { nullable: false }),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('automation_rules')],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Automation rule primary key.' },
    tenantForeignKey(),
  ],
};

/** Migration 004 descriptor. */
export const migration004SecurityAuditUsage: DatabaseMigration = {
  id: '004_security_audit_usage',
  order: 4,
  title: 'Security, audit, and usage/growth tables',
  description:
    'Create audit_logs, security_signals, ai_usage, sms_usage, media_generation_usage, ' +
    'campaigns, automation_rules. No raw secrets/payloads; audit details redacted.',
  status: 'planned',
  riskLevel: 'low',
  tables: [
    auditLogs,
    securitySignals,
    aiUsage,
    smsUsage,
    mediaGenerationUsage,
    campaigns,
    automationRules,
  ],
  operations: [
    {
      kind: 'create_table',
      table: 'audit_logs',
      description: 'Create audit_logs.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'security_signals',
      description: 'Create security_signals.',
      reversible: true,
    },
    { kind: 'create_table', table: 'ai_usage', description: 'Create ai_usage.', reversible: true },
    {
      kind: 'create_table',
      table: 'sms_usage',
      description: 'Create sms_usage.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'media_generation_usage',
      description: 'Create media_generation_usage.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'campaigns',
      description: 'Create campaigns.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'automation_rules',
      description: 'Create automation_rules.',
      reversible: true,
    },
  ],
  tenantScopingImpact:
    'All tables are tenant-scoped (site optional). Audit/security rows are preserved per the ' +
    'retention policy; usage counters are tenant/site scoped.',
  rollback: {
    reversible: true,
    strategy: 'manual_approval_required',
    requiresManualApproval: true,
    requiresBackup: true,
    tenantAware: true,
    steps: [
      'audit_logs and security_signals are preservation-critical: rollback requires explicit ' +
        'manual approval and a verified backup before any drop.',
      'Drop usage/growth tables (ai_usage, sms_usage, media_generation_usage, campaigns, ' +
        'automation_rules) first; treat audit_logs/security_signals drops as last resort.',
    ],
    notes:
      'Dropping audit/security tables is destructive to the compliance record — never automatic.',
  },
  safetyChecks: [
    {
      id: '004-tenant-scope',
      category: 'tenant_isolation',
      severity: 'blocking',
      description:
        'All tables include tenantId; usage tables are tenant (and optionally site) scoped.',
    },
    {
      id: '004-no-secret-payload',
      category: 'no_raw_secret',
      severity: 'blocking',
      description:
        'No secret payload storage; audit details are redacted and signals store safe summaries.',
    },
    {
      id: '004-audit-preserve',
      category: 'backup',
      severity: 'blocking',
      description:
        'audit_logs/security_signals rollback requires manual approval + verified backup.',
    },
    {
      id: '004-sms-pii',
      category: 'no_raw_pii',
      severity: 'blocking',
      description: 'SMS recipient is an opaque/hashed reference, never a raw phone number.',
    },
  ],
};
