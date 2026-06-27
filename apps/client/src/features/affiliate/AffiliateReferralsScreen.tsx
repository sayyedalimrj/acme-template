/**
 * AffiliateReferralsScreen — merchants this marketer referred ("/affiliate/referrals").
 *
 * Status-filterable list of referred stores with the commission earned from each. Mock data.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard } from '@/components/portal/PortalUI';
import { EmptyState } from '@/components/ui';
import {
  FilterChipRow,
  MobilePage,
  MobileTabHeader,
  siteInitials,
  type FilterChipOption,
} from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import type { ReferralStatus } from '@/domain/affiliate';

import { useAffiliateOverview, useAffiliateReferrals } from '@/services/affiliateApi';
import { referralStatusMeta } from './affiliateFormat';

type ReferralFilter = 'all' | ReferralStatus;

const FILTERS: readonly FilterChipOption<ReferralFilter>[] = [
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'trial', label: 'آزمایشی' },
  { value: 'lead', label: 'سرنخ' },
  { value: 'churned', label: 'از دست رفته' },
];

export function AffiliateReferralsScreen(): React.JSX.Element {
  const [filter, setFilter] = useState<ReferralFilter>('all');
  const { data: o } = useAffiliateOverview();
  const { data: referrals } = useAffiliateReferrals();

  const results = useMemo(
    () => referrals.filter((r) => filter === 'all' || r.status === filter),
    [filter, referrals],
  );

  return (
    <MobilePage testID="affiliate-referrals-screen" header={<MobileTabHeader title="معرفی‌ها" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PortalMetricTile label="کل معرفی‌ها" value={String(o.referralsTotal)} tone="info" />
          <PortalMetricTile label="فعال" value={String(o.referralsActive)} tone="success" />
          <PortalMetricTile label="نرخ تبدیل" value={o.conversionRateLabel} />
        </View>

        <FilterChipRow options={FILTERS} value={filter} onChange={setFilter} />

        {results.length === 0 ? (
          <EmptyState title="موردی نیست" body="با این فیلتر معرفی‌ای وجود ندارد." fill={false} />
        ) : (
          <View style={{ gap: 10 }}>
            {results.map((r) => (
              <PortalRowCard
                key={r.id}
                initials={siteInitials(r.storeName)}
                title={r.storeName}
                subtitle={`${r.ownerName} • ${r.planLabel}`}
                meta={r.commissionLabel}
                metaSub={r.salesVolumeLabel ? `فروش: ${r.salesVolumeLabel}` : r.joinedAt}
                badge={referralStatusMeta(r.status)}
                testID={`affiliate-referral-${r.id}`}
              />
            ))}
          </View>
        )}
      </View>
    </MobilePage>
  );
}
