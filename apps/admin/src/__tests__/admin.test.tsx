import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { PlatformOverviewScreen } from '@/features/PlatformOverviewScreen';
import { TenantDetailScreen } from '@/features/TenantDetailScreen';
import { WorkflowBoardScreen } from '@/features/WorkflowBoardScreen';
import { WorkflowDetailScreen } from '@/features/WorkflowDetailScreen';
import { platformSecuritySignals, platformSites, platformTenants } from '@/mock/platformAdmin';
import { workflowItems } from '@/mock/workflows';
import { platformService } from '@/services/platformService';
import { workflowService } from '@/services/workflowService';
import { SystemProvider } from '@/system';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, replace: () => {}, back: () => {}, canGoBack: () => false }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 1280, height: 900 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithProviders(ui: ReactElement): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <SystemProvider>{children}</SystemProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}

describe('platformService', () => {
  it('builds an overview with KPIs derived from the mock data', async () => {
    const o = await platformService.getOverview();
    expect(o.kpis.totalCustomers).toBe(platformTenants.length);
    expect(o.kpis.activeSites).toBeGreaterThan(0);
    expect(Number.parseFloat(o.kpis.mrr)).toBeGreaterThan(0);
    expect(o.atRiskTenants.length).toBeGreaterThan(0);
    expect(o.recentSecuritySignals.length).toBeGreaterThan(0);
  });

  it('returns tenants/sites/security and rejects unknown tenant ids', async () => {
    expect((await platformService.listTenants()).length).toBe(platformTenants.length);
    expect((await platformService.listSites()).length).toBe(platformSites.length);
    expect((await platformService.listSecuritySignals()).length).toBe(platformSecuritySignals.length);
    expect((await platformService.getTenant('tn_atlas')).name).toBe('Atlas Home Goods');
    await expect(platformService.getTenant('nope')).rejects.toThrow();
  });
});

describe('workflowService', () => {
  it('returns workflow items + board KPIs and rejects unknown ids', async () => {
    expect((await workflowService.listWorkflows()).length).toBe(workflowItems.length);
    const k = await workflowService.getBoardKpis();
    expect(k.open).toBeGreaterThan(0);
    expect(k.urgent).toBeGreaterThanOrEqual(1);
    expect((await workflowService.getWorkflow('wf_1')).title).toContain('Northwind');
    await expect(workflowService.getWorkflow('nope')).rejects.toThrow();
  });
});

describe('mock data is frontend-safe', () => {
  it('contains no secrets, billing IDs, or store credentials', () => {
    const blob = JSON.stringify([platformTenants, platformSites, platformSecuritySignals, workflowItems]);
    expect(blob).not.toMatch(
      /sk_live|sk_test|pk_live|whsec_|consumer_secret|consumer_key|signing[_-]?secret|app(lication)?[_-]?password/i,
    );
    platformTenants.forEach((t) => expect(t.owner.email.endsWith('@example.test')).toBe(true));
  });
});

describe('admin screens', () => {
  it('overview renders KPI + customer sections', async () => {
    renderWithProviders(<PlatformOverviewScreen />);
    expect(await screen.findByTestId('platform-overview-screen', {}, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText('Atlas Home Goods', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('Northwind Outfitters')).toBeTruthy();
  });

  it('tenant detail renders the tenant and its site health', async () => {
    renderWithProviders(<TenantDetailScreen tenantId="tn_atlas" />);
    expect(await screen.findByTestId('tenant-detail-screen', {}, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText('Atlas Home Goods', {}, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText('Atlas Home — Main', {}, { timeout: 4000 })).toBeTruthy();
  });

  it('workflow board renders items grouped into columns', async () => {
    renderWithProviders(<WorkflowBoardScreen />);
    expect(await screen.findByTestId('workflow-board-screen', {}, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText('Recover stalled sync — Northwind', {}, { timeout: 4000 })).toBeTruthy();
  });

  it('workflow detail renders a workflow item', async () => {
    renderWithProviders(<WorkflowDetailScreen workflowId="wf_2" />);
    expect(await screen.findByTestId('workflow-detail-screen', {}, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText('Invalid signature review — Saffron', {}, { timeout: 4000 })).toBeTruthy();
  });
});
