/**
 * Migration descriptor types (design/contracts only — NO SQL runner, NO DB).
 *
 * Dependency-free TypeScript descriptors that describe the PLANNED production migrations for
 * the WordPress Commerce OS platform. There is NO executable SQL, NO database connection, NO
 * ORM, and NO migration runner here — these are inert data structures + small pure factory
 * helpers used to document and validate the migration plan before any real database exists.
 *
 * Binding rules (see `security-model.md` + `../schemaDesign.ts`):
 * - Every tenant-scoped table carries a `tenantId` column; site-scoped tables carry `siteId`
 *   (and `tenantId`); sync-derived tables carry `syncRunId`.
 * - NO raw secret columns, NO raw PII columns (only explicitly gated `*Restricted` fields),
 *   NO raw payload / raw meta columns, NO payment card columns.
 */
import type { DataVisibilityLevel } from '../accessPolicy';
import type { SchemaTableName } from '../schemaDesign';

/** Stable migration id (e.g. `001_initial_platform_schema`). */
export type MigrationId = string;

/**
 * Lifecycle status of a migration. In this scaffold every migration is `planned` — nothing is
 * applied, because there is no database.
 */
export type MigrationStatus = 'planned' | 'ready' | 'applied' | 'rolled_back' | 'skipped';

/** Risk level of applying a migration. */
export type MigrationRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Provider-agnostic logical column type (mapped to a concrete engine type later). */
export type MigrationColumnType =
  | 'uuid'
  | 'text'
  | 'varchar'
  | 'boolean'
  | 'integer'
  | 'numeric'
  | 'timestamptz'
  | 'date'
  | 'enum'
  | 'jsonb_safe';

/** Role a column plays in tenant/site/sync scoping. */
export type MigrationColumnScope =
  | 'primary_key'
  | 'tenant_scope'
  | 'site_scope'
  | 'sync_scope'
  | 'attribute';

/** A planned column descriptor. */
export interface MigrationColumn {
  name: string;
  type: MigrationColumnType;
  nullable: boolean;
  isPrimaryKey?: boolean;
  scope: MigrationColumnScope;
  /** `table.column` reference for a foreign key, if any (non-secret id reference). */
  references?: string;
  /** Data-visibility classification for this column (drives later field gating). */
  visibility?: DataVisibilityLevel;
  description?: string;
}

/** A planned index descriptor. */
export interface MigrationIndex {
  name: string;
  columns: string[];
  unique?: boolean;
  description?: string;
}

/** Kind of a planned constraint. */
export type MigrationConstraintKind =
  | 'primary_key'
  | 'foreign_key'
  | 'unique'
  | 'check'
  | 'not_null';

/** A planned constraint descriptor. */
export interface MigrationConstraint {
  kind: MigrationConstraintKind;
  columns: string[];
  /** `table.column` for a foreign key. */
  references?: string;
  description: string;
}

/** A planned table descriptor within a migration. */
export interface MigrationTable {
  name: SchemaTableName;
  description: string;
  tenantScoped: boolean;
  siteScoped: boolean;
  syncScoped: boolean;
  columns: MigrationColumn[];
  indexes: MigrationIndex[];
  constraints: MigrationConstraint[];
}

/** Kind of a planned operation (no SQL is emitted; these are descriptors only). */
export type MigrationOperationKind =
  | 'create_table'
  | 'alter_table'
  | 'create_index'
  | 'add_constraint'
  | 'create_enum'
  | 'data_migration';

/** A planned operation descriptor. */
export interface MigrationOperation {
  kind: MigrationOperationKind;
  table?: SchemaTableName;
  description: string;
  /** Whether this specific operation is reversible without data loss. */
  reversible: boolean;
}

/** Strategy used to roll a migration back. */
export type MigrationRollbackStrategy =
  | 'drop_created_objects'
  | 'reverse_data_migration'
  | 'restore_from_backup'
  | 'manual_approval_required';

/** A planned rollback plan for a migration. */
export interface MigrationRollbackPlan {
  reversible: boolean;
  strategy: MigrationRollbackStrategy;
  requiresManualApproval: boolean;
  requiresBackup: boolean;
  /** Tenant-aware rollback note (rollbacks must respect tenant scoping). */
  tenantAware: boolean;
  steps: string[];
  notes?: string;
}

/** Category of a safety check. */
export type MigrationSafetyCheckCategory =
  | 'tenant_isolation'
  | 'no_raw_secret'
  | 'no_raw_pii'
  | 'reversibility'
  | 'backup'
  | 'data_integrity';

/** Severity of a safety check. */
export type MigrationSafetyCheckSeverity = 'info' | 'warning' | 'blocking';

/** A planned safety check that must hold before a migration is applied. */
export interface MigrationSafetyCheck {
  id: string;
  category: MigrationSafetyCheckCategory;
  severity: MigrationSafetyCheckSeverity;
  description: string;
}

/** A full planned database migration descriptor (inert; never executed here). */
export interface DatabaseMigration {
  id: MigrationId;
  /** 1-based ordering within the manifest. */
  order: number;
  title: string;
  description: string;
  status: MigrationStatus;
  riskLevel: MigrationRiskLevel;
  /** Tables created or changed by this migration. */
  tables: MigrationTable[];
  /** Operations the migration performs (descriptors only; no SQL). */
  operations: MigrationOperation[];
  /** Human description of the tenant-scoping impact of this migration. */
  tenantScopingImpact: string;
  rollback: MigrationRollbackPlan;
  safetyChecks: MigrationSafetyCheck[];
}

// ---------------------------------------------------------------------------
// Pure column factory helpers (reduce repetition; produce safe descriptors).
// ---------------------------------------------------------------------------

/** Primary-key `id` column. */
export function idColumn(): MigrationColumn {
  return {
    name: 'id',
    type: 'uuid',
    nullable: false,
    isPrimaryKey: true,
    scope: 'primary_key',
    visibility: 'tenant_safe',
    description: 'Opaque primary key.',
  };
}

/** Tenant-scope `tenantId` column (FK → tenants.id). */
export function tenantIdColumn(): MigrationColumn {
  return {
    name: 'tenantId',
    type: 'uuid',
    nullable: false,
    scope: 'tenant_scope',
    references: 'tenants.id',
    visibility: 'tenant_safe',
    description: 'Owning tenant (required on every tenant-scoped row).',
  };
}

/** Site-scope `siteId` column (FK → sites.id). */
export function siteIdColumn(nullable = false): MigrationColumn {
  return {
    name: 'siteId',
    type: 'uuid',
    nullable,
    scope: 'site_scope',
    references: 'sites.id',
    visibility: 'tenant_safe',
    description: 'Owning site (required on every site-scoped row).',
  };
}

/** Sync-scope `syncRunId` column (FK → sync_runs.id). */
export function syncRunIdColumn(nullable = false): MigrationColumn {
  return {
    name: 'syncRunId',
    type: 'uuid',
    nullable,
    scope: 'sync_scope',
    references: 'sync_runs.id',
    visibility: 'tenant_safe',
    description: 'Originating sync run (required on sync-derived rows).',
  };
}

/** `createdAt` + `updatedAt` timestamp columns. */
export function timestampColumns(): MigrationColumn[] {
  return [
    {
      name: 'createdAt',
      type: 'timestamptz',
      nullable: false,
      scope: 'attribute',
      visibility: 'tenant_safe',
      description: 'Row creation time.',
    },
    {
      name: 'updatedAt',
      type: 'timestamptz',
      nullable: true,
      scope: 'attribute',
      visibility: 'tenant_safe',
      description: 'Last update time.',
    },
  ];
}

/** A generic attribute column. */
export function column(
  name: string,
  type: MigrationColumnType,
  options: Partial<Omit<MigrationColumn, 'name' | 'type' | 'scope'>> = {},
): MigrationColumn {
  return {
    name,
    type,
    nullable: options.nullable ?? true,
    scope: 'attribute',
    isPrimaryKey: options.isPrimaryKey,
    references: options.references,
    visibility: options.visibility ?? 'tenant_safe',
    description: options.description,
  };
}

/** Standard tenant-scope index for a table. */
export function tenantIndex(table: SchemaTableName): MigrationIndex {
  return {
    name: `idx_${table}_tenant`,
    columns: ['tenantId'],
    description: 'Tenant-scoped lookup index.',
  };
}

/** Standard tenant primary-key + FK constraints. */
export function tenantForeignKey(): MigrationConstraint {
  return {
    kind: 'foreign_key',
    columns: ['tenantId'],
    references: 'tenants.id',
    description: 'Tenant FK enforces tenant ownership.',
  };
}
