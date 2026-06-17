/**
 * Migration manifest (design/contracts only — NO SQL runner, NO DB).
 *
 * Ordered list of the PLANNED production migrations + pure lookup/validation helpers. This is
 * inert data: importing it executes nothing against any database. The manifest is the
 * design-time source of truth for migration order and scope.
 */
import { migration001InitialPlatformSchema } from './001_initial_platform_schema';
import { migration002SyncReadModels } from './002_sync_read_models';
import { migration003SupportWorkflowsBilling } from './003_support_workflows_billing';
import { migration004SecurityAuditUsage } from './004_security_audit_usage';
import type { DatabaseMigration, MigrationId } from './migrationTypes';

/** The ordered migration manifest. Order is significant (dependencies flow forward). */
export const MIGRATION_MANIFEST: readonly DatabaseMigration[] = [
  migration001InitialPlatformSchema,
  migration002SyncReadModels,
  migration003SupportWorkflowsBilling,
  migration004SecurityAuditUsage,
];

/** Look up a migration by id. */
export function getMigration(id: MigrationId): DatabaseMigration | undefined {
  return MIGRATION_MANIFEST.find((migration) => migration.id === id);
}

/** All migration ids, in manifest order. */
export function listMigrationIds(): MigrationId[] {
  return MIGRATION_MANIFEST.map((migration) => migration.id);
}

/** True if the manifest `order` values are strictly increasing from 1 with no gaps. */
export function isManifestOrdered(): boolean {
  return MIGRATION_MANIFEST.every((migration, index) => migration.order === index + 1);
}

/** Every table name created across all migrations (in order). */
export function listAllMigratedTableNames(): string[] {
  return MIGRATION_MANIFEST.flatMap((migration) => migration.tables.map((table) => table.name));
}

/** Total number of planned migrations. */
export const MIGRATION_COUNT = MIGRATION_MANIFEST.length;
