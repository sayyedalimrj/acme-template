/**
 * Platform service — in-memory, mock-only access to platform-admin data.
 *
 * No backend, no network, no persistence, no secrets. A future `apps/api` (platform DB +
 * RBAC + audit) replaces this surface server-side without UI rework.
 */
import type {
  PlatformAdminOverview,
  PlatformAdminPriority,
  PlatformAdminTask,
  PlatformSecuritySignal,
  PlatformSiteSummary,
  PlatformSubscriptionState,
  PlatformTenant,
  PlatformUsageSummary,
} from '@/domain/types';
import {
  platformAdminTasks,
  platformSecuritySignals,
  platformSites,
  platformTenants,
  platformUsageSummaries,
} from '@/mock/platformAdmin';

const PRIORITY_RANK: Record<PlatformAdminPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const delay = (ms = 140) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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
    atRiskTenants: clone([...platformTenants].sort((a, b) => a.healthScore - b.healthScore).slice(0, 3)),
    sitesAtRisk: clone([...platformSites].sort((a, b) => a.healthScore - b.healthScore).slice(0, 4)),
    topTasks: clone(
      [...platformAdminTasks]
        .filter((t) => t.status !== 'done')
        .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
        .slice(0, 4),
    ),
    recentSecuritySignals: clone(
      [...platformSecuritySignals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    ),
    subscriptionBreakdown,
  };
}

export const platformService = {
  async getOverview(): Promise<PlatformAdminOverview> {
    await delay();
    return buildOverview();
  },
  async listTenants(): Promise<PlatformTenant[]> {
    await delay();
    return clone([...platformTenants].sort((a, b) => a.healthScore - b.healthScore));
  },
  async getTenant(id: string): Promise<PlatformTenant> {
    await delay();
    const tenant = platformTenants.find((t) => t.id === id);
    if (!tenant) throw new Error(`Platform tenant not found: ${id}`);
    return clone(tenant);
  },
  async listSites(): Promise<PlatformSiteSummary[]> {
    await delay();
    return clone(platformSites);
  },
  async listSecuritySignals(): Promise<PlatformSecuritySignal[]> {
    await delay();
    return clone([...platformSecuritySignals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async listAdminTasks(): Promise<PlatformAdminTask[]> {
    await delay();
    return clone(platformAdminTasks);
  },
  async listUsage(): Promise<PlatformUsageSummary[]> {
    await delay();
    return clone(platformUsageSummaries);
  },
};
