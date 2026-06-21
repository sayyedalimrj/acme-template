/**
 * Order list screen (mobile-first).
 *
 * Calm orders view: a soft search field, a single low-density status filter row, and tidy
 * order cards (order number, customer name label, date, total, one status chip, and a small
 * "needs attention" dot). The customer label uses the name only — no raw email is shown on the
 * card. RTL-correct. Mock-only data via useOrders; rows deep-link to order detail.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import {
  AnimatedSection,
  EmptySiteCard,
  FilterChipRow,
  MobilePage,
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
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
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
import { useOrders } from './useOrders';

function toStatusTone(tone: BadgeTone): StatusTone {
  if (tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'info') {
    return tone;
  }
  return 'neutral';
}

/** Customer name label (no raw email shown on the card). Falls back to a generic label. */
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
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        {/* Line 1: order number (leading) + total (trailing) on the same baseline. */}
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <Text
            style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}
            numberOfLines={1}
          >
            #{order.number}
          </Text>
          {attention ? (
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.badge }}
            />
          ) : null}
          <View style={{ flex: 1 }} />
          <Text
            style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}
            numberOfLines={1}
          >
            {fmt.money(order.total, order.currency)}
          </Text>
        </View>

        {/* Line 2: customer name. */}
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

        {/* Line 3: status chip (leading) + date (trailing). */}
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <StatusBadge tone={toStatusTone(status.tone)} label={t(status.labelKey)} />
          <View style={{ flex: 1 }} />
          <Text
            style={{ fontSize: mobileType.captionSize, color: colors.mutedSoft }}
            numberOfLines={1}
          >
            {fmt.date(order.dateCreated)}
          </Text>
        </View>
      </View>

      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.mutedSoft}
      />
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
  const ordersQuery = useOrders();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatusFilter>('all');

  const items = ordersQuery.data?.items;
  const filtered = useMemo(
    () => filterOrders(items ?? [], { search, status }),
    [items, search, status],
  );

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <MobilePage testID="order-list-screen" header={<ScreenTitle title={t('orders.title')} />}>
        <View style={{ paddingHorizontal: mobileMetrics.screenPadding }}>
          <EmptySiteCard
            onPrimary={() => router.navigate('/onboarding' as never)}
            onSecondary={() => router.navigate('/connect-site' as never)}
          />
        </View>
      </MobilePage>
    );
  }

  return (
    <MobilePage testID="order-list-screen" header={<ScreenTitle title={t('orders.title')} />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16 }}>
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

        {ordersQuery.isPending ? (
          <Text style={{ color: colors.muted, textAlign: isRTL ? 'right' : 'left' }}>
            {t('common.loading')}
          </Text>
        ) : ordersQuery.isError ? (
          <PressableScale
            onPress={() => ordersQuery.refetch()}
            accessibilityLabel={t('common.retry')}
            style={{ paddingVertical: 24, alignItems: 'center' }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {t('orders.error')} · {t('common.retry')}
            </Text>
          </PressableScale>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={34} color={colors.mutedSoft} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>{t('orders.empty')}</Text>
          </View>
        ) : (
          <AnimatedSection index={1}>
            <View
              testID="order-list"
              style={[
                {
                  borderRadius: mobileMetrics.cardRadius,
                  backgroundColor: colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                },
                shadow,
              ]}
            >
              {filtered.map((order, index) => (
                <View key={order.id}>
                  {index > 0 ? (
                    <View style={{ height: 1, backgroundColor: colors.separator }} />
                  ) : null}
                  <OrderRow
                    order={order}
                    customerFallback={t('orders.customerFallback')}
                    onPress={() => router.navigate(`/orders/${order.id}` as never)}
                  />
                </View>
              ))}
            </View>
          </AnimatedSection>
        )}
      </View>
    </MobilePage>
  );
}
