/**
 * Order list screen (mobile-first) with accumulating pagination — scroll position stays stable.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { ListPaginationFooter } from '@/components/ui/ListPaginationFooter';
import {
  AnimatedSection,
  EmptySiteCard,
  FilterChipRow,
  MobileListPage,
  MobileSearchField,
  MobileTabHeader,
  PressableScale,
  StatusBadge,
  type StatusTone,
} from '@/features/mobile/components';
import {
  mobileMetrics,
  mobileType,
  useMobileColors,
  useMobileShadow,
} from '@/features/mobile/mobileTokens';
import { useInfinitePagedQuery } from '@/hooks/useInfinitePagedQuery';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { orderService, queryKeys } from '@/services';
import { useTheme } from '@/theme';
import type { BadgeTone } from '@/components/ui';
import type { Order } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  filterOrders,
  needsAttention,
  orderStatusBadge,
  type OrderStatusFilter,
} from './orderHelpers';

const PAGE_SIZE = 20;

function toStatusTone(tone: BadgeTone): StatusTone {
  if (tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'info') {
    return tone;
  }
  return 'neutral';
}

function customerLabel(order: Order, fallback: string): string {
  const name = `${order.billing.firstName} ${order.billing.lastName}`.trim();
  return name.length > 0 ? name : fallback;
}

const STATUS_FILTERS: readonly { value: OrderStatusFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'orders.filter.allStatus' },
  { value: 'pending', labelKey: 'orders.status.pending' },
  { value: 'processing', labelKey: 'orders.status.processing' },
  { value: 'on-hold', labelKey: 'orders.status.on-hold' },
  { value: 'completed', labelKey: 'orders.status.completed' },
  { value: 'cancelled', labelKey: 'orders.status.cancelled' },
  { value: 'refunded', labelKey: 'orders.status.refunded' },
  { value: 'failed', labelKey: 'orders.status.failed' },
];

function ScreenTitle({ title }: { title: string }): React.JSX.Element {
  return <MobileTabHeader title={title} />;
}

function OrderRow({
  order,
  onPress,
  customerFallback,
}: {
  order: Order;
  onPress: () => void;
  customerFallback: string;
}): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, isRTL } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const status = orderStatusBadge(order.status);
  const attention = needsAttention(order);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`#${order.number}`}
      pressScale={0.985}
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 10,
        minHeight: mobileMetrics.listRowHeight,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <Text
            style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}
            numberOfLines={1}
          >
            #{order.number}
          </Text>
          {attention ? (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.badge }} />
          ) : null}
          <View style={{ flex: 1 }} />
          <Text
            style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}
            numberOfLines={1}
          >
            {fmt.money(order.total, order.currency)}
          </Text>
        </View>
        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: colors.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {customerLabel(order, customerFallback)}
        </Text>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <StatusBadge tone={toStatusTone(status.tone)} label={t(status.labelKey)} />
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: mobileType.captionSize, color: colors.mutedSoft }} numberOfLines={1}>
            {fmt.date(order.dateCreated)}
          </Text>
        </View>
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.mutedSoft} />
    </PressableScale>
  );
}

export function OrderListScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();
  const activeSite = useActiveSite();
  const siteId = activeSite.data?.id;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatusFilter>('all');

  const listQuery = useInfinitePagedQuery({
    queryKey: queryKeys.orders(siteId ?? 'none'),
    queryFn: (q) => orderService.listOrders(q),
    query: {
      status: status === 'all' ? undefined : status,
    },
    pageSize: PAGE_SIZE,
    enabled: Boolean(siteId),
  });

  const filtered = useMemo(() => {
    return filterOrders(listQuery.items, { search, status: 'all' });
  }, [listQuery.items, search]);

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <MobileListPage
        testID="order-list-screen"
        header={<ScreenTitle title={t('orders.title')} />}
        data={[]}
        keyExtractor={() => 'empty'}
        renderItem={() => null}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: mobileMetrics.screenPadding }}>
            <EmptySiteCard
              onPrimary={() => router.navigate('/onboarding' as never)}
              onSecondary={() => router.navigate('/connect-site' as never)}
            />
          </View>
        }
      />
    );
  }

  return (
    <MobileListPage
      testID="order-list-screen"
      header={<ScreenTitle title={t('orders.title')} />}
      data={filtered}
      keyExtractor={(o) => o.id}
      renderItem={({ item, index }) => (
        <View
          testID={index === 0 ? 'order-list' : undefined}
          style={[
            {
              marginHorizontal: mobileMetrics.screenPadding,
              borderRadius: mobileMetrics.cardRadius,
              backgroundColor: colors.card,
            },
            index === 0 ? shadow : null,
          ]}
        >
          {index > 0 ? (
            <View style={{ height: 1, backgroundColor: colors.separator, marginHorizontal: 16 }} />
          ) : null}
          <OrderRow
            order={item}
            customerFallback={t('orders.customerFallback')}
            onPress={() => router.navigate(`/orders/${item.id}` as never)}
          />
        </View>
      )}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16, paddingBottom: 8 }}>
          <AnimatedSection index={0}>
            <View style={{ gap: 12 }}>
              <MobileSearchField
                value={search}
                onChangeText={setSearch}
                placeholder={t('orders.searchPlaceholder')}
                testID="order-search"
              />
              <FilterChipRow
                options={STATUS_FILTERS.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
                value={status}
                onChange={setStatus}
              />
            </View>
          </AnimatedSection>
        </View>
      }
      ListFooterComponent={
        <View style={{ paddingHorizontal: mobileMetrics.screenPadding }}>
          {listQuery.isError ? (
            <PressableScale
              onPress={listQuery.refetch}
              accessibilityLabel={t('common.retry')}
              style={{ paddingVertical: 24, alignItems: 'center' }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {t('orders.error')} · {t('common.retry')}
              </Text>
            </PressableScale>
          ) : (
            <ListPaginationFooter
              mode="infinite"
              page={listQuery.page}
              pageSize={PAGE_SIZE}
              total={listQuery.total}
              loading={listQuery.isFetchingNextPage}
              onLoadMore={listQuery.fetchNextPage}
            />
          )}
        </View>
      }
      ListEmptyComponent={
        listQuery.isPending ? (
          <Text style={{ color: colors.muted, textAlign: isRTL ? 'right' : 'left', padding: 16 }}>
            {t('common.loading')}
          </Text>
        ) : (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={34} color={colors.mutedSoft} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>{t('orders.empty')}</Text>
          </View>
        )
      }
      onEndReached={listQuery.fetchNextPage}
    />
  );
}
