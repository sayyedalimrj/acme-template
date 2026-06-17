/**
 * Dependency-free example checks for the migration scaffold (NO DB, NO SQL, NO secrets).
 *
 * Pure, runnable assertions over the inert migration descriptors. Verifies ordering, tenant/
 * site/sync scoping, the no-raw-secret and no-raw-payload rules, rollback plans, safety
 * checks, and that the environment contract lists NAMES only (never values). Mirrors the
 * `schemaExamples.ts` pattern. See `../README.md`.
 */
import { findSecretNeverExposeFields } from '../accessPolicy';
import { MIGRATION_MANIFEST, isManifestOrdered, listMigrationIds } from './migrationManifest';
import type { MigrationColumn, MigrationTable } from './migrationTypes';

/** A single example assertion result. */
export interface ExampleResult {
  name: string;
  passed: boolean;
  note: string;
}

/**
 * Future environment variable NAMES (placeholders only — never values). Kept here so the
 * "names only" guarantee is machine-checkable; the human-readable contract lives in
 * `../environmentContract.md`.
 */
export const ENVIRONMENT_CONTRACT_NAMES: readonly string[] = [
  'DATABASE_URL',
  'DATABASE_READONLY_URL',
  'DATABASE_MIGRATION_URL',
  'ENCRYPTION_KEY_REF',
  'SIGNING_SECRET_PROVIDER_REF',
];

/** Tables considered "sync read-model" tables for the no-raw-payload rule. */
const SYNC_TABLE_NAMES: readonly string[] = [
  'sync_runs',
  'synced_products',
  'synced_orders',
  'synced_customers',
  'plugin_events',
];

function allTables(): MigrationTable[] {
  return MIGRATION_MANIFEST.flatMap((migration) => migration.tables);
}

function hasColumn(table: MigrationTable, name: string): boolean {
  return table.columns.some((columnDef) => columnDef.name === name);
}

/** A sync column is forbidden if it looks like a raw payload/meta/notes/address or ungated PII. */
function isForbiddenSyncColumn(columnDef: MigrationColumn): boolean {
  const normalized = columnDef.name.toLowerCase();
  if (/(payload|meta|note|address)/.test(normalized)) {
    return true;
  }
  // Raw phone/email are only allowed as explicitly gated *Restricted columns.
  if (/(phone|email)/.test(normalized) && !normalized.endsWith('restricted')) {
    return true;
  }
  return false;
}

/** Run all migration-scaffold example checks. */
export function collectMigrationExampleResults(): ExampleResult[] {
  const results: ExampleResult[] = [];
  const tables = allTables();

  // 1. Manifest is ordered.
  {
    const ids = listMigrationIds();
    results.push({
      name: 'migration manifest is ordered',
      passed:
        isManifestOrdered() &&
        ids.length === 4 &&
        ids[0] === '001_initial_platform_schema' &&
        ids[3] === '004_security_audit_usage',
      note: 'Manifest order values are strictly increasing 1..4 in id order.',
    });
  }

  // 2. Every tenant-scoped table includes a tenantId column.
  {
    const offenders = tables.filter((table) => table.tenantScoped && !hasColumn(table, 'tenantId'));
    results.push({
      name: 'every tenant-scoped table includes tenantId',
      passed: offenders.length === 0,
      note: 'All tenant-scoped table descriptors carry a tenantId column.',
    });
  }

  // 3. Every site-scoped table includes siteId AND tenantId.
  {
    const offenders = tables.filter(
      (table) => table.siteScoped && (!hasColumn(table, 'siteId') || !hasColumn(table, 'tenantId')),
    );
    results.push({
      name: 'every site-scoped table includes siteId and tenantId',
      passed: offenders.length === 0,
      note: 'Site-scoped tables carry both siteId and tenantId.',
    });
  }

  // 3b. Every sync-scoped table includes syncRunId.
  {
    const offenders = tables.filter((table) => table.syncScoped && !hasColumn(table, 'syncRunId'));
    results.push({
      name: 'every sync-scoped table includes syncRunId',
      passed: offenders.length === 0,
      note: 'Sync-derived tables carry syncRunId.',
    });
  }

  // 4. No migration descriptor includes raw secret columns.
  {
    const columnNameBag: Record<string, true> = {};
    for (const table of tables) {
      for (const columnDef of table.columns) {
        columnNameBag[columnDef.name] = true;
      }
    }
    const offendingNames = findSecretNeverExposeFields(columnNameBag);
    results.push({
      name: 'no migration descriptor includes raw secret columns',
      passed: offendingNames.length === 0,
      note: 'No column name matches a raw-secret token (credentials use opaque vault refs).',
    });
  }

  // 5. No sync table includes raw payload/meta/notes/address or ungated PII columns.
  {
    const syncTables = tables.filter((table) => SYNC_TABLE_NAMES.includes(table.name));
    const offenders = syncTables.flatMap((table) =>
      table.columns
        .filter(isForbiddenSyncColumn)
        .map((columnDef) => `${table.name}.${columnDef.name}`),
    );
    results.push({
      name: 'no sync table includes raw payload/meta fields',
      passed: offenders.length === 0,
      note: 'Sync tables hold normalized summaries only; PII appears only as gated *Restricted columns.',
    });
  }

  // 6. Every migration has a rollback plan with at least one step.
  {
    const passed = MIGRATION_MANIFEST.every(
      (migration) => !!migration.rollback && migration.rollback.steps.length > 0,
    );
    results.push({
      name: 'rollback plans exist',
      passed,
      note: 'Each migration declares a rollback plan with concrete steps.',
    });
  }

  // 7. Every migration has at least one safety check.
  {
    const passed = MIGRATION_MANIFEST.every((migration) => migration.safetyChecks.length > 0);
    results.push({
      name: 'safety checks exist',
      passed,
      note: 'Each migration declares at least one safety check.',
    });
  }

  // 7b. Destructive audit/security rollback requires manual approval (004).
  {
    const m004 = MIGRATION_MANIFEST.find(
      (migration) => migration.id === '004_security_audit_usage',
    );
    results.push({
      name: 'audit rollback requires manual approval',
      passed: !!m004 && m004.rollback.requiresManualApproval && m004.rollback.requiresBackup,
      note: 'Dropping audit/security tables requires manual approval + verified backup.',
    });
  }

  // 8. Environment contract contains only names/placeholders, no values.
  {
    const namePattern = /^[A-Z][A-Z0-9_]*$/;
    const passed =
      ENVIRONMENT_CONTRACT_NAMES.length > 0 &&
      ENVIRONMENT_CONTRACT_NAMES.every(
        (name) => namePattern.test(name) && !name.includes('=') && !name.includes('://'),
      );
    results.push({
      name: 'environment contract contains only names/placeholders, no values',
      passed,
      note: 'Env contract lists uppercase variable NAMES only; no values, URLs, or secrets.',
    });
  }

  return results;
}

/** Eagerly computed example results. */
export const MIGRATION_EXAMPLE_RESULTS: ExampleResult[] = collectMigrationExampleResults();

/** True only if every migration-scaffold example check passes. */
export const ALL_MIGRATION_EXAMPLES_PASS: boolean = MIGRATION_EXAMPLE_RESULTS.every(
  (r) => r.passed,
);
