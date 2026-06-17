/**
 * Migration 001 — initial platform schema (descriptor only; NO SQL, NO DB).
 *
 * Plans the core tenant/identity/site/connection tables. Inert descriptor used to document
 * and validate the plan; nothing is executed. NO raw secret columns — credentials are
 * metadata + an opaque vault reference only. See `../schemaDesign.ts` + `security-model.md`.
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

const tenants: MigrationTable = {
  name: 'tenants',
  description: 'Owning organizations (tenant root). id IS the tenant id.',
  tenantScoped: false,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    column('name', 'text', { nullable: false, visibility: 'support_safe' }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('plan', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('region', 'varchar'),
    column('deletedAt', 'timestamptz', { description: 'Soft-delete marker.' }),
    column('legalHold', 'boolean', { description: 'Suspends retention deletion when true.' }),
    ...timestampColumns(),
  ],
  indexes: [{ name: 'idx_tenants_status', columns: ['status'] }],
  constraints: [{ kind: 'primary_key', columns: ['id'], description: 'Tenant primary key.' }],
};

const platformUsers: MigrationTable = {
  name: 'platform_users',
  description: 'Platform users (merchants + internal staff). No password/hash/token stored.',
  tenantScoped: false,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    column('primaryTenantId', 'uuid', { references: 'tenants.id', description: 'Home tenant.' }),
    column('displayName', 'text', { nullable: false, visibility: 'support_safe' }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('emailRestricted', 'text', {
      visibility: 'pii_restricted',
      description: 'Gated PII; empty by default, access-controlled.',
    }),
    column('isInternalStaff', 'boolean', { nullable: false }),
    column('lastLoginAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [{ name: 'idx_users_primary_tenant', columns: ['primaryTenantId'] }],
  constraints: [{ kind: 'primary_key', columns: ['id'], description: 'User primary key.' }],
};

const tenantMemberships: MigrationTable = {
  name: 'tenant_memberships',
  description: 'User ↔ tenant role bindings (tenant-scoped).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('userId', 'uuid', { nullable: false, references: 'platform_users.id' }),
    column('role', 'enum', { nullable: false }),
    column('status', 'enum', { nullable: false }),
    column('invitedByUserId', 'uuid', { references: 'platform_users.id' }),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('tenant_memberships'),
    { name: 'uniq_membership_tenant_user', columns: ['tenantId', 'userId'], unique: true },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Membership primary key.' },
    tenantForeignKey(),
    {
      kind: 'unique',
      columns: ['tenantId', 'userId'],
      description: 'One membership per user per tenant.',
    },
  ],
};

const sites: MigrationTable = {
  name: 'sites',
  description: 'Connected (or pending) WordPress/WooCommerce stores (tenant-scoped).',
  tenantScoped: true,
  siteScoped: false,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    column('displayName', 'text', { nullable: false, visibility: 'support_safe' }),
    column('url', 'text', { nullable: false }),
    column('platform', 'enum', { nullable: false }),
    column('environment', 'enum', { nullable: false }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('capabilities', 'jsonb_safe', { description: 'Non-secret capability flags.' }),
    column('lastSyncRunId', 'uuid', { description: 'Latest sync run id (set after 002).' }),
    column('lastSyncAt', 'timestamptz'),
    column('disconnectedAt', 'timestamptz'),
    column('deletedAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('sites'),
    { name: 'idx_sites_tenant_status', columns: ['tenantId', 'status'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Site primary key.' },
    tenantForeignKey(),
  ],
};

const siteConnections: MigrationTable = {
  name: 'site_connections',
  description: 'Connection channels for a site; references credential metadata (no secret).',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    column('channel', 'enum', { nullable: false }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('credentialMetadataId', 'uuid', {
      references: 'credential_metadata.id',
      visibility: 'security_restricted',
      description: 'Opaque link to credential metadata (never a secret).',
    }),
    column('capabilities', 'jsonb_safe'),
    column('verifiedAt', 'timestamptz'),
    column('revokedAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [tenantIndex('site_connections'), { name: 'idx_site_conn_site', columns: ['siteId'] }],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Site connection primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
  ],
};

const pluginConnections: MigrationTable = {
  name: 'plugin_connections',
  description: 'Companion-plugin connections for a site; opaque vault refs only (no secret).',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('pluginVersion', 'varchar'),
    column('signingKeyVaultRef', 'varchar', {
      visibility: 'security_restricted',
      description: 'OPAQUE vault reference to signing material. Never the key itself.',
    }),
    column('signingKeyId', 'varchar', {
      description: 'Non-secret signing-key identifier/fingerprint for rotation tracking.',
    }),
    column('lastSeenAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('plugin_connections'),
    { name: 'idx_plugin_conn_site', columns: ['siteId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Plugin connection primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
  ],
};

const credentialMetadata: MigrationTable = {
  name: 'credential_metadata',
  description: 'Credential METADATA only (kind/status/masked label + opaque vault ref). NO secret.',
  tenantScoped: true,
  siteScoped: true,
  syncScoped: false,
  columns: [
    idColumn(),
    tenantIdColumn(),
    siteIdColumn(),
    column('kind', 'enum', { nullable: false }),
    column('status', 'enum', { nullable: false, visibility: 'support_safe' }),
    column('vaultReference', 'varchar', {
      nullable: false,
      visibility: 'security_restricted',
      description: 'OPAQUE external vault/KMS reference. Never the secret material.',
    }),
    column('maskedLabel', 'varchar', { nullable: false, visibility: 'support_safe' }),
    column('permissionScope', 'jsonb_safe'),
    column('rotatedAt', 'timestamptz'),
    column('revokedAt', 'timestamptz'),
    column('lastUsedAt', 'timestamptz'),
    ...timestampColumns(),
  ],
  indexes: [
    tenantIndex('credential_metadata'),
    { name: 'idx_cred_meta_site', columns: ['siteId'] },
  ],
  constraints: [
    { kind: 'primary_key', columns: ['id'], description: 'Credential metadata primary key.' },
    tenantForeignKey(),
    { kind: 'foreign_key', columns: ['siteId'], references: 'sites.id', description: 'Site FK.' },
  ],
};

/** Migration 001 descriptor. */
export const migration001InitialPlatformSchema: DatabaseMigration = {
  id: '001_initial_platform_schema',
  order: 1,
  title: 'Initial platform schema',
  description:
    'Create the core tenant/identity/site/connection tables: tenants, platform_users, ' +
    'tenant_memberships, sites, site_connections, plugin_connections, credential_metadata.',
  status: 'planned',
  riskLevel: 'medium',
  tables: [
    tenants,
    platformUsers,
    tenantMemberships,
    sites,
    siteConnections,
    pluginConnections,
    credentialMetadata,
  ],
  operations: [
    { kind: 'create_table', table: 'tenants', description: 'Create tenants.', reversible: true },
    {
      kind: 'create_table',
      table: 'platform_users',
      description: 'Create platform_users.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'tenant_memberships',
      description: 'Create tenant_memberships.',
      reversible: true,
    },
    { kind: 'create_table', table: 'sites', description: 'Create sites.', reversible: true },
    {
      kind: 'create_table',
      table: 'site_connections',
      description: 'Create site_connections.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'plugin_connections',
      description: 'Create plugin_connections.',
      reversible: true,
    },
    {
      kind: 'create_table',
      table: 'credential_metadata',
      description: 'Create credential_metadata.',
      reversible: true,
    },
  ],
  tenantScopingImpact:
    'Establishes the tenant root and the tenant-scoped membership/site/connection tables. ' +
    'All non-root tables carry tenantId; connection/credential tables also carry siteId.',
  rollback: {
    reversible: true,
    strategy: 'drop_created_objects',
    requiresManualApproval: false,
    requiresBackup: true,
    tenantAware: true,
    steps: [
      'Drop tables in reverse dependency order (credential_metadata → … → tenants).',
      'No data backfill in this migration, so rollback is a clean structural drop.',
    ],
    notes: 'Reversible structural migration; back up before applying in production.',
  },
  safetyChecks: [
    {
      id: '001-tenant-scope',
      category: 'tenant_isolation',
      severity: 'blocking',
      description:
        'Every non-root table includes tenantId; connection/credential tables include siteId.',
    },
    {
      id: '001-no-secret',
      category: 'no_raw_secret',
      severity: 'blocking',
      description:
        'No raw secret columns; credentials store metadata + an opaque vault reference only.',
    },
    {
      id: '001-pii-gated',
      category: 'no_raw_pii',
      severity: 'blocking',
      description: 'User email is an explicitly gated pii_restricted column, empty by default.',
    },
    {
      id: '001-reversible',
      category: 'reversibility',
      severity: 'info',
      description: 'Structural-only; reversible by dropping created objects.',
    },
  ],
};
