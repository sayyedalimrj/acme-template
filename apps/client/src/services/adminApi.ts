/**
 * Admin portal live-data service (http) + react-query hooks.
 *
 * When a backend is configured (`isApiConfigured`) these hooks fetch real platform data and map it
 * onto the admin display types. When not configured (local/dev/tests) they fall back to the
 * in-memory mock constants so the UI stays fully functional with no network.
 */
import { isApiConfigured } from '@/config/api.config';
import { http } from '@/services/httpClient';
import { bpsPercentLabel, tomanLabel } from '@/services/portalFormat';
import { useLiveData, type LiveData } from '@/services/useLiveData';
import type {
  AdminMarketerSummary,
  AdminMerchant,
  AdminOrderSummary,
  AdminOverview,
  AdminPayoutRequest,
  MerchantAccountStatus,
  PayoutRequestStatus,
} from '@/domain/admin';
import type { OrderStatus, SubscriptionPlanId } from '@/domain/types';

import {
  ADMIN_MARKETERS,
  ADMIN_MERCHANTS,
  ADMIN_ORDERS,
  ADMIN_OVERVIEW,
  ADMIN_PAYOUT_REQUESTS,
} from '@/features/admin/adminMockData';

// ---- mappers (backend → display types) ----

function mapOverview(o: Record<string, unknown>): AdminOverview {
  return {
    merchantsTotal: Number(o.merchants_total ?? 0),
    merchantsActive: Number(o.merchants_active ?? 0),
    merchantsTrialing: Number(o.merchants_trialing ?? 0),
    mrrLabel: tomanLabel(Number(o.mrr ?? 0)),
    gmvLabel: tomanLabel(Number(o.gmv ?? 0)),
    openSupport: 0,
    pendingPayouts: Number(o.pending_payouts ?? 0),
    pendingPayoutsAmountLabel: tomanLabel(0),
    metrics: [],
    recentActivity: [],
  };
}

function mapMerchant(m: Record<string, unknown>): AdminMerchant {
  return {
    id: String(m.id),
    storeName: String(m.store_name ?? ''),
    ownerName: String(m.owner_name ?? ''),
    url: String(m.url ?? ''),
    planId: (String(m.plan ?? 'starter') as SubscriptionPlanId),
    planName: String(m.plan ?? ''),
    status: (String(m.status ?? 'trial') as MerchantAccountStatus),
    mrrLabel: tomanLabel(Number(m.mrr_amount ?? 0)),
    storeSalesLabel: tomanLabel(Number(m.store_sales_amount ?? 0)),
    ordersCount: Number(m.sites ?? 0),
    productsCount: 0,
    joinedAt: '',
    lastActiveAt: '',
  };
}

function mapOrder(o: Record<string, unknown>): AdminOrderSummary {
  return {
    id: String(o.external_id ?? o.id ?? ''),
    number: String(o.number ?? ''),
    storeName: String(o.store_name ?? ''),
    merchantId: '',
    customerName: String(o.customer_name ?? ''),
    status: (String(o.status ?? 'pending') as OrderStatus),
    totalLabel: tomanLabel(Number(o.total_minor ?? 0)),
    createdAt: String(o.external_created_at ?? ''),
  };
}

function mapMarketer(m: Record<string, unknown>): AdminMarketerSummary {
  return {
    id: String(m.id),
    name: String(m.name ?? ''),
    code: String(m.code ?? ''),
    status: (String(m.status ?? 'active') as 'active' | 'paused'),
    referralsTotal: Number(m.referrals_total ?? 0),
    activeReferrals: Number(m.active_referrals ?? 0),
    commissionRateLabel: bpsPercentLabel(Number(m.commission_rate_bps ?? 0)),
    commissionPendingLabel: tomanLabel(Number(m.commission_pending ?? 0)),
    commissionPaidLabel: tomanLabel(Number(m.commission_paid ?? 0)),
    joinedAt: '',
  };
}

function mapPayout(p: Record<string, unknown>): AdminPayoutRequest {
  return {
    id: String(p.id),
    marketerId: '',
    marketerName: String(p.marketer_name ?? ''),
    amountLabel: tomanLabel(Number(p.amount ?? 0)),
    method: (String(p.method ?? 'bank_card') as AdminPayoutRequest['method']),
    maskedDestination: String(p.masked_destination ?? ''),
    status: (String(p.status ?? 'requested') as PayoutRequestStatus),
    requestedAt: String(p.requested_at ?? ''),
  };
}

// ---- hooks (live when configured; mock fallback otherwise) ----

export function useAdminOverview(): LiveData<AdminOverview> {
  return useLiveData<AdminOverview>(ADMIN_OVERVIEW, async () => {
    const res = await http.get<{ overview: Record<string, unknown> }>('/admin/overview');
    return mapOverview(res.overview ?? {});
  });
}

export function useAdminMerchants(): LiveData<AdminMerchant[]> {
  return useLiveData<AdminMerchant[]>([...ADMIN_MERCHANTS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/admin/merchants?pageSize=100');
    return res.items.map(mapMerchant);
  });
}

export function useAdminOrders(): LiveData<AdminOrderSummary[]> {
  return useLiveData<AdminOrderSummary[]>([...ADMIN_ORDERS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/admin/orders?pageSize=100');
    return res.items.map(mapOrder);
  });
}

export function useAdminMarketers(): LiveData<AdminMarketerSummary[]> {
  return useLiveData<AdminMarketerSummary[]>([...ADMIN_MARKETERS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/admin/marketers?pageSize=100');
    return res.items.map(mapMarketer);
  });
}

export function useAdminPayouts(): LiveData<AdminPayoutRequest[]> {
  return useLiveData<AdminPayoutRequest[]>([...ADMIN_PAYOUT_REQUESTS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/admin/payouts');
    return res.items.map(mapPayout);
  });
}

/** Perform a payout action on the backend (no-op in mock mode). */
export async function adminPayoutAction(
  id: string,
  action: 'approve' | 'reject' | 'mark_paid',
): Promise<void> {
  if (!isApiConfigured()) return;
  await http.patch(`/admin/payouts/${id}`, { action });
}
