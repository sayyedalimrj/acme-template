# Rollback Strategy (design record)

> **Status: design record only.** No migration runs or rolls back in this PR. This documents
> the rollback principles each migration descriptor encodes (`migrationTypes.ts` →
> `MigrationRollbackPlan`).

## Principles

- **Reversible-first.** Prefer migrations that can be reversed by dropping the objects they
  created, with no data loss. Migrations `001`–`003` are reversible structural migrations.
- **Destructive migrations require explicit manual approval.** Any migration that could drop
  or anonymize existing data (notably audit/security tables in `004`) sets
  `requiresManualApproval: true` and is never rolled back automatically.
- **Separate schema from data migrations.** Structural DDL and data backfills are distinct
  steps with distinct rollbacks; a data migration declares a `reverse_data_migration` plan.
- **Backup before production migration.** Every production migration sets `requiresBackup:
true`; a verified backup must exist before applying or rolling back.
- **Tenant-aware rollback.** Rollbacks respect tenant scoping (`tenantAware: true`) and must
  never leak or cross-wire data between tenants.
- **Audit rollback actions.** Applying and rolling back migrations is itself an audited,
  privileged action (who/what/when), with secrets redacted.
- **No automatic destructive cleanup.** No job automatically drops tables or purges data;
  destructive steps are human-initiated, approved, and logged.

## Per-migration rollback summary

| Migration                       | Reversible | Strategy                 | Manual approval | Notes                                                      |
| ------------------------------- | ---------- | ------------------------ | --------------- | ---------------------------------------------------------- |
| `001_initial_platform_schema`   | yes        | drop created objects     | no              | Structural only; clean drop in reverse order.              |
| `002_sync_read_models`          | yes        | drop created objects     | no              | Drop `sites.lastSyncRunId` FK, then sync tables.           |
| `003_support_workflows_billing` | yes        | drop created objects     | no              | Structural only; reverse-order drop.                       |
| `004_security_audit_usage`      | guarded    | manual approval required | **yes**         | `audit_logs`/`security_signals` are preservation-critical. |

## Preservation rules

- **`audit_logs` and `security_signals` are preservation-critical.** Their rollback/drop
  requires explicit manual approval plus a verified backup, consistent with the retention
  policy (`dataRetention.ts`, audit-preservation rules).
- Synced summary rows (`002`) are reproducible from a fresh sync, so their rollback is
  low-risk — but a backup is still required before production changes.
