/**
 * Dashboard service — thin wrapper over the active DashboardAdapter.
 */
import { getAdapters } from '@/adapters';
import { isApiConfigured } from '@/config/api.config';
import { http } from '@/services/httpClient';
import type { DashboardOverview } from '@/domain/types';

import { getActiveHttpSiteId } from '@/adapters/http/httpActiveSite';

export interface OverviewSeriesResponse {
  range: string;
  currency: string;
  sales: { day: string; orders: number; revenue_minor: number | string }[];
  customers: { day: string; new_customers: number }[];
}

export const dashboardService = {
  getOverview(): Promise<DashboardOverview> {
    return getAdapters().dashboard.getOverview();
  },

  async getOverviewSeries(range: '7d' | '30d' | '90d' = '7d'): Promise<OverviewSeriesResponse | null> {
    if (!isApiConfigured()) return null;
    const siteId = getActiveHttpSiteId();
    if (!siteId) return null;
    return http.get<OverviewSeriesResponse>(
      `/merchant/sites/${siteId}/reports/overview-series?range=${range}`,
    );
  },
};
