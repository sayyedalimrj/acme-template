/**
 * DEVELOPMENT-ONLY in-memory plugin sync repository (backend skeleton).
 *
 * A tiny, process-lifetime store for normalized read-only sync data. This is explicitly a
 * DEV/MOCK repository: there is NO database, NO filesystem write, NO localStorage, and NO
 * external service. State lives only in memory and resets on restart. Stored collections are
 * capped to avoid unbounded growth. The real, persistent, tenant-isolated database schema is
 * a future phase. See `security-model.md`.
 */
import type { SiteId } from '../domain/site';
import type { SyncAuditEntry, SyncRun, SyncedSiteSnapshot } from './pluginReadModels';

/** Cap on distinct site snapshots retained (oldest inserted site evicted beyond this). */
export const DEV_REPOSITORY_MAX_SNAPSHOTS = 50;

/** Cap on retained sync runs (oldest dropped beyond this). */
export const DEV_REPOSITORY_MAX_SYNC_RUNS = 200;

/** Cap on retained audit entries (oldest dropped beyond this). */
export const DEV_REPOSITORY_MAX_AUDIT_ENTRIES = 200;

/**
 * Development-only in-memory repository contract. The `DevRepository` naming and docs make it
 * explicit that this is NOT a production datastore.
 */
export interface InMemoryPluginSyncRepository {
  /** Save (replace) the latest snapshot for a site. Returns the stored snapshot. */
  saveSiteSnapshot(snapshot: SyncedSiteSnapshot): SyncedSiteSnapshot;
  /** Get the latest snapshot for a site, if any. */
  getSiteSnapshot(siteId: SiteId): SyncedSiteSnapshot | undefined;
  /** List all retained site snapshots (latest per site). */
  listSiteSnapshots(): SyncedSiteSnapshot[];
  /** Append a sync run record (capped). Returns the stored run. */
  saveSyncRun(run: SyncRun): SyncRun;
  /** List sync runs, optionally filtered by site. Most recent first. */
  listSyncRuns(siteId?: SiteId): SyncRun[];
  /** Append an audit entry (capped). Returns the stored entry. */
  saveAuditEntry(entry: SyncAuditEntry): SyncAuditEntry;
  /** List audit entries, optionally filtered by site. Most recent first. */
  listAuditEntries(siteId?: SiteId): SyncAuditEntry[];
  /** Clear ALL in-memory dev state (snapshots, runs, audit). For tests/examples/reset. */
  clearDevRepository(): void;
}

/**
 * Create an isolated DEVELOPMENT-ONLY in-memory sync repository. No persistence of any kind.
 * Each call returns a fresh, independent instance.
 */
export function createInMemoryPluginSyncRepository(): InMemoryPluginSyncRepository {
  const snapshots = new Map<SiteId, SyncedSiteSnapshot>();
  let runs: SyncRun[] = [];
  let audit: SyncAuditEntry[] = [];

  return {
    saveSiteSnapshot(snapshot: SyncedSiteSnapshot): SyncedSiteSnapshot {
      // Evict the oldest inserted site when adding a NEW site beyond the cap.
      if (!snapshots.has(snapshot.siteId) && snapshots.size >= DEV_REPOSITORY_MAX_SNAPSHOTS) {
        const oldestKey = snapshots.keys().next().value;
        if (oldestKey !== undefined) {
          snapshots.delete(oldestKey);
        }
      }
      snapshots.set(snapshot.siteId, snapshot);
      return snapshot;
    },

    getSiteSnapshot(siteId: SiteId): SyncedSiteSnapshot | undefined {
      return snapshots.get(siteId);
    },

    listSiteSnapshots(): SyncedSiteSnapshot[] {
      return Array.from(snapshots.values());
    },

    saveSyncRun(run: SyncRun): SyncRun {
      runs.push(run);
      if (runs.length > DEV_REPOSITORY_MAX_SYNC_RUNS) {
        runs = runs.slice(runs.length - DEV_REPOSITORY_MAX_SYNC_RUNS);
      }
      return run;
    },

    listSyncRuns(siteId?: SiteId): SyncRun[] {
      const list = siteId ? runs.filter((run) => run.siteId === siteId) : runs.slice();
      return list.reverse();
    },

    saveAuditEntry(entry: SyncAuditEntry): SyncAuditEntry {
      audit.push(entry);
      if (audit.length > DEV_REPOSITORY_MAX_AUDIT_ENTRIES) {
        audit = audit.slice(audit.length - DEV_REPOSITORY_MAX_AUDIT_ENTRIES);
      }
      return entry;
    },

    listAuditEntries(siteId?: SiteId): SyncAuditEntry[] {
      const list = siteId ? audit.filter((entry) => entry.siteId === siteId) : audit.slice();
      return list.reverse();
    },

    clearDevRepository(): void {
      snapshots.clear();
      runs = [];
      audit = [];
    },
  };
}
