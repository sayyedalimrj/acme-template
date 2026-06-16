/**
 * Adapter interfaces — the seam between the app and any data source.
 *
 * Screens never call these directly; they go through services + query hooks. The MVP wires
 * a mock implementation. A future `http` implementation will target OUR backend/proxy with
 * an identical surface, so no screen code changes when real data arrives (design.md §5).
 *
 * Only the Dashboard adapter is defined in Task 1 (dashboard-only scope). Product/Order/
 * Customer/Site/Auth adapters are added with their respective modules.
 */
import type { DashboardSummary } from '@/domain/types';

export interface DashboardAdapter {
  /** Returns the overview summary for the active site. */
  getSummary(): Promise<DashboardSummary>;
}

export interface Adapters {
  dashboard: DashboardAdapter;
}
