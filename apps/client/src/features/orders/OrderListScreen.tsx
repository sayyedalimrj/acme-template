/**
 * Order list screen.
 *
 * Active-site-aware order operations view: search (order #, customer name/email) + status
 * and fulfillment filters over the mocked orders, with loading/empty/error states. Rows
 * surface payment/fulfillment/status visibility and an "action needed" flag, and navigate
 * to order detail. Filtering is client-side for snappy UX; `useOrders` also accepts
 * server-side query params for future real-data scale.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import type { Order } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  filterOrders,
  fulfillmentBadge,
  needsAttention,
  orderItemCount,
  orderStatusBadge,
  paymentBadge,
  type FulfillmentFilter,
  type OrderStatusFilter,
} from './orderHelpers';
import { useOrders } from './useOrders';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: ChipProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        paddingVertical: tokens.spacing.xs + 2,
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.pill,
        borderWidth: tokens.borderWidth.thin,
        borderColor: active ? tokens.color.primary : tokens.color.border,
        backgroundColor: active ? tokens.color.primarySoft : tokens.color.surface,
      }}
    >
      <Text
        variant="caption"
        style={{ color: active ? tokens.color.primary : tokens.color.textMuted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface OrderRowProps {
  order: Order;
  onPress: () => void;
}

function OrderRow({ order, onPress }: OrderRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const status = orderStatusBadge(order.status);
  const payment = paymentBadge(order.status);
  const fulfillment = fulfillmentBadge(order.fulfillment);
  const attention = needsAttention(order);

  const rowStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.borderWidth.hairline,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.number}`}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
          <Text variant="subheading">#{order.number}</Text>
          {attention ? <Badge tone="danger" label={t('orders.attention')} /> : null}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {order.billing.firstName} {order.billing.lastName} · {order.billing.email}
        </Text>
        <Text variant="caption" tone="muted">
          {formatDate(order.dateCreated)} · {formatNumber(orderItemCount(order))}{' '}
          {t('orders.items')}
        </Text>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Badge tone={status.tone} label={t(status.labelKey)} />
          <Badge tone={payment.tone} label={t(payment.labelKey)} />
          <Badge tone={fulfillment.tone} label={t(fulfillment.labelKey)} />
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text variant="label">{formatCurrency(order.total, order.currency)}</Text>
        <Text variant="caption" tone="muted">
          {order.currency}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.color.textMuted} />
    </Pressable>
  );
}

const STATUS_FILTERS: { value: OrderStatusFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'orders.filter.allStatus' },
  { value: 'processing', labelKey: 'orders.status.processing' },
  { value: 'pending', labelKey: 'orders.status.pending' },
  { value: 'on-hold', labelKey: 'orders.status.on-hold' },
  { value: 'completed', labelKey: 'orders.status.completed' },
  { value: 'refunded', labelKey: 'orders.status.refunded' },
];

const FULFILLMENT_FILTERS: { value: FulfillmentFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'orders.filter.allFulfillment' },
  { value: 'unfulfilled', labelKey: 'orders.fulfillment.unfulfilled' },
  { value: 'partial', labelKey: 'orders.fulfillment.partial' },
  { value: 'fulfilled', labelKey: 'orders.fulfillment.fulfilled' },
];

export function OrderListScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();

  const activeSite = useActiveSite();
  const ordersQuery = useOrders();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatusFilter>('all');
  const [fulfillment, setFulfillment] = useState<FulfillmentFilter>('all');

  const items = ordersQuery.data?.items;
  const filtered = useMemo(
    () => filterOrders(items ?? [], { search, status, fulfillment }),
    [items, search, status, fulfillment],
  );
  const total = items?.length ?? 0;

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('orders.noSite.title')}
          body={t('orders.noSite.body')}
          icon="storefront-outline"
          action={{
            label: t('site.connectCta'),
            onPress: () => router.navigate('/connect-site' as never),
          }}
        />
      </Screen>
    );
  }

  const chipRow: ViewStyle = {
    flexDirection: rowDirection,
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  };

  return (
    <Screen testID="order-list-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('orders.title')}</Text>
        <Text tone="muted">{t('orders.subtitle')}</Text>
      </View>

      <Card>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('orders.searchPlaceholder')}
          autoCapitalize="none"
          testID="order-search"
        />
        <View style={chipRow}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={t(f.labelKey)}
              active={status === f.value}
              onPress={() => setStatus(f.value)}
            />
          ))}
        </View>
        <View style={chipRow}>
          {FULFILLMENT_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={t(f.labelKey)}
              active={fulfillment === f.value}
              onPress={() => setFulfillment(f.value)}
            />
          ))}
        </View>
      </Card>

      {ordersQuery.isPending ? (
        <LoadingState label={t('common.loading')} />
      ) : ordersQuery.isError ? (
        <ErrorState
          title={t('orders.error')}
          retryLabel={t('common.retry')}
          onRetry={() => ordersQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('orders.empty')} icon="receipt-outline" fill={false} />
      ) : (
        <View style={{ gap: tokens.spacing.sm }} testID="order-list">
          <Text variant="caption" tone="muted">
            {formatNumber(filtered.length)} / {formatNumber(total)}
          </Text>
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onPress={() => router.navigate(`/orders/${order.id}` as never)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
