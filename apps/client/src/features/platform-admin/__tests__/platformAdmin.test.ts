import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import {
  platformSecuritySignals,
  platformSites,
  platformTenants,
} from '@/mock/data/platformAdmin';
import { platformAdminService } from '@/services';

beforeEach(() => {
  resetAdaptersForTests();
});

describe('platformAdminService', () => {
  it('returns a decision-first platform overview with KPIs', async () => {
    const overview = await platformAdminService.getPlatformOverview();
    expect(overview.kpis.totalCustomers).toBe(platformTenants.length);
    expect(overview.kpis.activeSites).toBeGreaterThan(0);
    expect(Number.parseFloat(overview.kpis.mrr)).toBeGreaterThan(0);
    expect(overview.atRiskTenants.length).toBeGreaterThan(0);
    expect(overview.topTasks.length).toBeGreaterThan(0);
    expect(overview.recentSecuritySignals.length).toBeGreaterThan(0);
    // At-risk tenants are ordered worst-health first.
    expect(overview.atRiskTenants[0].healthScore).toBeLessThanOrEqual(
      overview.atRiskTenants[overview.atRiskTenants.length - 1].healthScore,
    );
  });

  it('lists tenants, sites and security signals', async () => {
    expect((await platformAdminService.listPlatformTenants()).length).toBe(platformTenants.length);
    expect((await platformAdminService.listPlatformSites()).length).toBe(platformSites.length);
    expect((await platformAdminService.listPlatformSecuritySignals()).length).toBe(
      platformSecuritySignals.length,
    );
    expect((await platformAdminService.listPlatformAdminTasks()).length).toBeGreaterThan(0);
    expect((await platformAdminService.listPlatformUsageSummaries()).length).toBeGreaterThan(0);
    expect((await platformAdminService.listPlatformSupportItems()).length).toBeGreaterThan(0);
  });

  it('gets a tenant by id and rejects unknown ids', async () => {
    const tenant = await platformAdminService.getPlatformTenant('tn_atlas');
    expect(tenant.name).toBe('Atlas Home Goods');
    await expect(platformAdminService.getPlatformTenant('does-not-exist')).rejects.toThrow();
  });
});

describe('platform admin mock data is frontend-safe', () => {
  it('contains no secrets, billing provider IDs, or store credentials', () => {
    const blob = JSON.stringify([platformTenants, platformSites, platformSecuritySignals]);
    expect(blob).not.toMatch(
      /sk_live|sk_test|pk_live|pk_test|whsec_|consumer_secret|consumer_key|signing[_-]?secret|app(lication)?[_-]?password/i,
    );
  });

  it('uses only clearly-fake example.test owner emails (no real PII)', () => {
    platformTenants.forEach((tenant) => {
      expect(tenant.owner.email.endsWith('@example.test')).toBe(true);
    });
  });

  it('every site belongs to a known tenant (realistic relationships)', () => {
    const tenantIds = new Set(platformTenants.map((t) => t.id));
    platformSites.forEach((site) => {
      expect(tenantIds.has(site.tenantId)).toBe(true);
    });
  });
});
