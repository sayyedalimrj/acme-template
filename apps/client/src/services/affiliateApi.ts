/**
 * Affiliate portal live-data service (http) + react-query hooks. Live when a backend is
 * configured; mock fallback otherwise (so the UI works offline / in tests).
 */
import { isApiConfigured } from '@/config/api.config';
import { http } from '@/services/httpClient';
import { bpsPercentLabel, tomanLabel } from '@/services/portalFormat';
import { useLiveData, type LiveData } from '@/services/useLiveData';
import type {
  AffiliateOverview,
  AffiliatePayout,
  AffiliateProfile,
  AffiliateReferral,
  CommissionEntry,
  CommissionStatus,
  ReferralStatus,
} from '@/domain/affiliate';
import type { PayoutMethod, PayoutRequestStatus } from '@/domain/admin';

import {
  AFFILIATE_COMMISSIONS,
  AFFILIATE_OVERVIEW,
  AFFILIATE_PAYOUTS,
  AFFILIATE_PROFILE,
  AFFILIATE_REFERRALS,
} from '@/features/affiliate/affiliateMockData';

interface OverviewResponse {
  overview: {
    paid: string;
    pending: string;
    referrals_total: number;
    referrals_active: number;
    referred_sales_total?: string | number;
  };
  profile: { code: string; commission_rate_bps: number; tier: string; status: string };
  availableBalanceMinor: number;
  referralLink: string | null;
}

export function useAffiliateOverview(): LiveData<AffiliateOverview> {
  return useLiveData<AffiliateOverview>(AFFILIATE_OVERVIEW, async () => {
    const res = await http.get<OverviewResponse>('/affiliate/overview');
    const o = res.overview;
    const total = Number(o.paid) + Number(o.pending);
    return {
      totalEarnedLabel: tomanLabel(total),
      pendingLabel: tomanLabel(o.pending),
      paidLabel: tomanLabel(o.paid),
      thisMonthLabel: tomanLabel(o.pending),
      availableLabel: tomanLabel(res.availableBalanceMinor),
      referralsTotal: o.referrals_total,
      referralsActive: o.referrals_active,
      conversionRateLabel: bpsPercentLabel(
        o.referrals_total > 0 ? Math.round((o.referrals_active / o.referrals_total) * 10000) : 0,
      ),
    } satisfies AffiliateOverview;
  });
}

export function useAffiliateProfile(): LiveData<AffiliateProfile> {
  return useLiveData<AffiliateProfile>(AFFILIATE_PROFILE, async () => {
    const res = await http.get<OverviewResponse>('/affiliate/overview');
    return {
      name: AFFILIATE_PROFILE.name,
      code: res.profile.code,
      referralLink: res.referralLink ?? '',
      tierLabel: res.profile.tier,
      commissionRateLabel: bpsPercentLabel(res.profile.commission_rate_bps),
    } satisfies AffiliateProfile;
  });
}

export function useAffiliateReferrals(): LiveData<AffiliateReferral[]> {
  return useLiveData<AffiliateReferral[]>([...AFFILIATE_REFERRALS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/affiliate/referrals?pageSize=100');
    return res.items.map((r) => ({
      id: String(r.id),
      storeName: String(r.store_name ?? '—'),
      ownerName: '',
      status: (String(r.status ?? 'lead') as ReferralStatus),
      planLabel: '',
      joinedAt: String(r.created_at ?? ''),
      commissionLabel: tomanLabel(Number(r.commission_earned ?? 0)),
      salesVolumeLabel: tomanLabel(Number(r.store_sales_amount ?? 0)),
    }));
  });
}

export function useAffiliateCommissions(): LiveData<CommissionEntry[]> {
  return useLiveData<CommissionEntry[]>([...AFFILIATE_COMMISSIONS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/affiliate/commissions?pageSize=100');
    return res.items.map((c) => ({
      id: String(c.id),
      referralStoreName: '',
      amountLabel: tomanLabel(Number(c.amount ?? 0)),
      rateLabel: bpsPercentLabel(Number(c.rate_bps ?? 0)),
      status: (String(c.status ?? 'pending') as CommissionStatus),
      periodLabel: String(c.period ?? ''),
      createdAt: String(c.created_at ?? ''),
    }));
  });
}

export function useAffiliatePayouts(): LiveData<AffiliatePayout[]> {
  return useLiveData<AffiliatePayout[]>([...AFFILIATE_PAYOUTS], async () => {
    const res = await http.get<{ items: Record<string, unknown>[] }>('/affiliate/payouts');
    return res.items.map((p) => ({
      id: String(p.id),
      amountLabel: tomanLabel(Number(p.amount ?? 0)),
      method: (String(p.method ?? 'bank_card') as PayoutMethod),
      maskedDestination: String(p.masked_destination ?? ''),
      status: (String(p.status ?? 'requested') as PayoutRequestStatus),
      requestedAt: String(p.requested_at ?? ''),
      paidAt: p.paid_at ? String(p.paid_at) : undefined,
    }));
  });
}

/**
 * Request a payout for the full available balance on the backend (no-op in mock mode).
 * The amount is resolved server-side-safely from the marketer's current available balance.
 */
export async function requestFullPayout(method: PayoutMethod = 'bank_card'): Promise<void> {
  if (!isApiConfigured()) return;
  const overview = await http.get<OverviewResponse>('/affiliate/overview');
  const amount = Number(overview.availableBalanceMinor) || 0;
  if (amount <= 0) throw new Error('موجودی قابل برداشت ندارید.');
  await http.post('/affiliate/payouts', { amount, method });
}
