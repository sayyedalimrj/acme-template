/**
 * AffiliateEarningsScreen — the commission ledger ("/affiliate/earnings").
 *
 * Summary tiles + a status-filterable list of commission entries. Mock data.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard } from '@/components/portal/PortalUI';
import { EmptyState } from '@/components/ui';
import {
  FilterChipRow,
  MobilePage,
  MobileTabHeader,
  type FilterChipOption,
} from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import type { CommissionStatus } from '@/domain/affiliate';

import { useAffiliateCommissions, useAffiliateOverview } from '@/services/affiliateApi';
import { commissionStatusMeta } from './affiliateFormat';

type CommissionFilter = 'all' | CommissionStatus;

const FILTERS: readonly FilterChipOption<CommissionFilter>[] = [
  { value: 'all', label: 'همه' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'approved', label: 'تأیید شده' },
  { value: 'paid', label: 'پرداخت‌شده' },
  { value: 'reversed', label: 'برگشتی' },
];

export function AffiliateEarningsScreen(): React.JSX.Element {
  const [filter, setFilter] = useState<CommissionFilter>('all');
  const { data: o } = useAffiliateOverview();
  const { data: commissions } = useAffiliateCommissions();

  const results = useMemo(
    () => commissions.filter((c) => filter === 'all' || c.status === filter),
    [filter, commissions],
  );

  return (
    <MobilePage testID="affiliate-earnings-screen" header={<MobileTabHeader title="درآمد و پورسانت" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PortalMetricTile label="کل درآمد" value={o.totalEarnedLabel} tone="success" />
          <PortalMetricTile label="در انتظار" value={o.pendingLabel} tone="warning" />
          <PortalMetricTile label="پرداخت‌شده" value={o.paidLabel} />
        </View>

        <FilterChipRow options={FILTERS} value={filter} onChange={setFilter} />

        {results.length === 0 ? (
          <EmptyState title="موردی نیست" body="با این فیلتر پورسانتی ثبت نشده است." fill={false} />
        ) : (
          <View style={{ gap: 10 }}>
            {results.map((c) => (
              <PortalRowCard
                key={c.id}
                icon="cash-outline"
                title={c.referralStoreName}
                subtitle={`${c.periodLabel} • نرخ ${c.rateLabel}`}
                meta={c.amountLabel}
                metaSub={c.createdAt}
                badge={commissionStatusMeta(c.status)}
                testID={`affiliate-commission-${c.id}`}
              />
            ))}
          </View>
        )}
      </View>
    </MobilePage>
  );
}
