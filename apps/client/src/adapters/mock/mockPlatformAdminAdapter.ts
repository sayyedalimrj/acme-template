/**
 * Mock Platform Admin adapter.
 *
 * Serves OUR internal control-layer data (tenants, sites, security signals, usage, admin
 * tasks) from in-memory mock fixtures and derives the decision-first overview from them.
 *
 * SECURITY (binding): frontend-safe only — no real PII, no secrets, no billing IDs, no
 * plugin signing secrets, no WooCommerce credentials, no network, no persistence. A future
 * `apps/admin` + `apps/api` replace this surface server-side. See security-model.md.
 */
import {
  platformAdminTasks,
  platformSecuritySignals,
  platformSites,
  platformTenants,
  platformUsageSummaries,
} from '@/mock/data/platformAdmin';
import type {
  PlatformAdminOverview,
  PlatformAdminTask,
  PlatformAdminPriority,
  PlatformSecuritySignal,
  PlatformSiteSummary,
  PlatformSubscriptionState,
  PlatformTenant,
  PlatformUsageSummary,
} from '@/domain/types';

import type { PlatformAdminAdapter } from '../types';
import { clone, delay } from './mockUtils';

const PRIORITY_RANK: Record<PlatformAdminPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** A site is a "sync issue" when it is not steadily syncing or has recent failures. */
function siteHasSyncIssue(site: PlatformSiteSummary): boolean {
  return site.sync.state !== 'healthy' || site.sync.failures > 0;
}

function buildOverview(): PlatformAdminOverview {
  const activeSites = platformSites.filter((s) => s.connection === 'connected').length;
  const openSupport = platformTenants.reduce((sum, t) => sum + t.support.openItems, 0);
  const syncIssues = platformSites.filter(siteHasSyncIssue).length;
  const securityAlerts = platformSecuritySignals.filter((s) => !s.acknowledged).length;
  const mrrTotal = platformTenants
    .filter((t) => t.subscription.state === 'active')
    .reduce((sum, t) => sum + Number.parseFloat(t.subscription.mrr), 0);

  const states: PlatformSubscriptionState[] = ['trialing', 'active', 'past_due', 'canceled'];
  const subscriptionBreakdown = states.map((state) => ({
    state,
    count: platformTenants.filter((t) => t.subscription.state === state).length,
  }));

  const atRiskTenants = [...platformTenants]
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 3);
  const sitesAtRisk = [...platformSites].sort((a, b) => a.healthScore - b.healthScore).slice(0, 4);
  const topTasks = [...platformAdminTasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 4);
  const recentSecuritySignals = [...platformSecuritySignals]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return {
    kpis: {
      totalCustomers: platformTenants.length,
      activeSites,
      mrr: mrrTotal.toFixed(2),
      currency: 'USD',
      openSupport,
      syncIssues,
      securityAlerts,
    },
    atRiskTenants: clone(atRiskTenants),
    sitesAtRisk: clone(sitesAtRisk),
    topTasks: clone(topTasks),
    recentSecuritySignals: clone(recentSecuritySignals),
    subscriptionBreakdown,
  };
}

export function createMockPlatformAdminAdapter(): PlatformAdminAdapter {
  return {
    async getPlatformOverview(): Promise<PlatformAdminOverview> {
      await delay(200);
      return buildOverview();
    },

    async listPlatformTenants(): Promise<PlatformTenant[]> {
      await delay(180);
      return clone([...platformTenants].sort((a, b) => a.healthScore - b.healthScore));
    },

    async getPlatformTenant(id: string): Promise<PlatformTenant> {
      await delay(150);
      const tenant = platformTenants.find((t) => t.id === id);
      if (!tenant) {
        throw new Error(`Platform tenant not found: ${id}`);
      }
      return clone(tenant);
    },

    async listPlatformSites(): Promise<PlatformSiteSummary[]> {
      await delay(180);
      return clone(platformSites);
    },

    async listPlatformSecuritySignals(): Promise<PlatformSecuritySignal[]> {
      await delay(160);
      return clone(
        [...platformSecuritySignals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    },

    async listPlatformAdminTasks(): Promise<PlatformAdminTask[]> {
      await delay(160);
      return clone(
        [...platformAdminTasks].sort(
          (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
        ),
      );
    },

    async listPlatformUsageSummaries(): Promise<PlatformUsageSummary[]> {
      await delay(150);
      return clone(platformUsageSummaries);
    },

    async listPlatformSupportItems(): Promise<PlatformAdminTask[]> {
      await delay(150);
      // Support-flavored items = tenants with open support, surfaced as operational tasks.
      const items = platformTenants
        .filter((t) => t.support.openItems > 0)
        .map<PlatformAdminTask>((t) => ({
          id: `support_${t.id}`,
          title: `${t.name}: ${t.support.openItems} open support item(s)`,
          status: 'open',
          priority: t.support.priority,
          owner: t.support.owner,
          tenantId: t.id,
          nextAction: 'Triage open support items and confirm the owner.',
        }))
        .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      return clone(items);
    },
  };
}
