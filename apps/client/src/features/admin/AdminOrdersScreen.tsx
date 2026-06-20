/**
 * AdminOrdersScreen — platform-wide orders across every store ("/admin/orders").
 *
 * Searchable, status-filterable read-only list. Mock data only.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PortalRowCard } from '@/components/portal/PortalUI';
import { EmptyState } from '@/components/ui';
import {
  FilterChipRow,
  MobilePage,
  MobileSearchField,
  MobileTabHeader,
  type FilterChipOption,
} from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import type { OrderStatus } from '@/domain/types';

import { useAdminOrders } from '@/services/adminApi';
import { orderStatusMeta } from './adminFormat';

type OrderFilter = 'all' | OrderStatus;

const FILTERS: readonly FilterChipOption<OrderFilter>[] = [
  { value: 'all', label: 'همه' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'processing', label: 'در حال پردازش' },
  { value: 'on-hold', label: 'بررسی' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'refunded', label: 'بازپرداخت' },
];

export function AdminOrdersScreen(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('all');
  const { data: orders } = useAdminOrders();

  const results = useMemo(() => {
    const q = search.trim();
    return orders.filter((o) => {
      const matchesStatus = filter === 'all' || o.status === filter;
      const matchesQuery =
        q.length === 0 ||
        o.number.includes(q) ||
        o.storeName.includes(q) ||
        o.customerName.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [search, filter, orders]);

  return (
    <MobilePage testID="admin-orders-screen" header={<MobileTabHeader title="سفارش‌ها" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 14 }}>
        <MobileSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="جستجوی شماره سفارش، فروشگاه یا مشتری"
          testID="admin-orders-search"
        />
        <FilterChipRow options={FILTERS} value={filter} onChange={setFilter} />

        {results.length === 0 ? (
          <EmptyState title="سفارشی پیدا نشد" body="فیلتر یا عبارت جستجو را تغییر دهید." fill={false} />
        ) : (
          <View style={{ gap: 10 }}>
            {results.map((o) => (
              <PortalRowCard
                key={o.id}
                icon="receipt-outline"
                title={`${o.number} • ${o.storeName}`}
                subtitle={o.customerName}
                meta={o.totalLabel}
                metaSub={o.createdAt}
                badge={orderStatusMeta(o.status)}
                testID={`admin-order-${o.id}`}
              />
            ))}
          </View>
        )}
      </View>
    </MobilePage>
  );
}
