/**
 * AdminMerchantsScreen — manage the platform's merchants ("/admin/merchants").
 *
 * Searchable, status-filterable list of merchant accounts. Tapping a row opens the merchant
 * detail. Mock data only.
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PortalRowCard } from '@/components/portal/PortalUI';
import { EmptyState } from '@/components/ui';
import {
  FilterChipRow,
  MobilePage,
  MobileSearchField,
  MobileTabHeader,
  siteInitials,
  type FilterChipOption,
} from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import type { MerchantAccountStatus } from '@/domain/admin';

import { ADMIN_MERCHANTS } from './adminMockData';
import { merchantStatusMeta } from './adminFormat';

type StatusFilter = 'all' | MerchantAccountStatus;

const FILTERS: readonly FilterChipOption<StatusFilter>[] = [
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'trial', label: 'آزمایشی' },
  { value: 'past_due', label: 'معوق' },
  { value: 'suspended', label: 'معلق' },
];

export function AdminMerchantsScreen(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const results = useMemo(() => {
    const q = search.trim();
    return ADMIN_MERCHANTS.filter((m) => {
      const matchesStatus = filter === 'all' || m.status === filter;
      const matchesQuery =
        q.length === 0 || m.storeName.includes(q) || m.ownerName.includes(q) || m.url.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [search, filter]);

  return (
    <MobilePage testID="admin-merchants-screen" header={<MobileTabHeader title="فروشندگان" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 14 }}>
        <MobileSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="جستجوی فروشگاه یا مالک"
          testID="admin-merchants-search"
        />
        <FilterChipRow options={FILTERS} value={filter} onChange={setFilter} />

        {results.length === 0 ? (
          <EmptyState title="موردی پیدا نشد" body="فیلتر یا عبارت جستجو را تغییر دهید." fill={false} />
        ) : (
          <View style={{ gap: 10 }}>
            {results.map((m) => {
              const meta = merchantStatusMeta(m.status);
              return (
                <PortalRowCard
                  key={m.id}
                  initials={siteInitials(m.storeName)}
                  title={m.storeName}
                  subtitle={`${m.ownerName} • ${m.planName}`}
                  meta={m.mrrLabel}
                  metaSub={`${m.ordersCount} سفارش`}
                  badge={meta}
                  onPress={() => router.navigate(`/admin/merchants/${m.id}` as never)}
                  testID={`admin-merchant-${m.id}`}
                />
              );
            })}
          </View>
        )}
      </View>
    </MobilePage>
  );
}
