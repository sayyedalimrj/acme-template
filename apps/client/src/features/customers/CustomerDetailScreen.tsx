/**
 * Customer detail screen.
 *
 * Read-only customer profile: contact, customer-value signals (total spent, orders, AOV,
 * last order), segment, recent order history (cross-links to order detail), and a
 * marketing/consent placeholder. No edits/notes mutations. Active-site-aware via
 * `useCustomer`. The order-status badge is reused from the Orders module for consistency.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { orderStatusBadge } from '@/features/orders/orderHelpers';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { Customer } from '@/domain/types';

import {
  averageOrderValue,
  customerFullName,
  customerSegment,
  segmentBadge,
} from './customerHelpers';
import { useCustomer } from './useCustomers';

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

function DetailRow({ label, value }: DetailRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        paddingVertical: tokens.spacing.xs,
      }}
    >
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

function RecentOrders({ customer }: { customer: Customer }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const orders = customer.recentOrders ?? [];

  if (orders.length === 0) {
    return <Text tone="muted">{t('customer.orders.empty')}</Text>;
  }

  return (
    <View style={{ gap: tokens.spacing.sm }}>
      {orders.map((order, index) => {
        const status = orderStatusBadge(order.status);
        return (
          <View key={order.orderId} style={{ gap: tokens.spacing.sm }}>
            {index > 0 ? <Divider /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Order ${order.number}`}
              onPress={() => router.navigate(`/orders/${order.orderId}` as never)}
              style={({ pressed }) => [
                {
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  borderRadius: tokens.radius.sm,
                },
                pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="label">#{order.number}</Text>
                <Text variant="caption" tone="muted">
                  {fmt.date(order.dateCreated)}
                </Text>
              </View>
              <Badge tone={status.tone} label={t(status.labelKey)} />
              <Text variant="label">{fmt.money(order.total, order.currency)}</Text>
              <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export interface CustomerDetailScreenProps {
  customerId: string;
}

export function CustomerDetailScreen({ customerId }: CustomerDetailScreenProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();

  const activeSite = useActiveSite();
  const { data: customer, isPending, isError, refetch } = useCustomer(customerId);

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('customers.noSite.title')}
          body={t('customers.noSite.body')}
          icon="storefront-outline"
          action={{
            label: t('site.connectCta'),
            onPress: () => router.navigate('/connect-site' as never),
          }}
        />
      </Screen>
    );
  }

  if (isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError || !customer) {
    return (
      <Screen testID="customer-detail-screen" title={t('customer.notFound.title')}>
        <ErrorState
          title={t('customer.notFound.title')}
          body={t('customer.notFound.body')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  const segment = segmentBadge(customerSegment(customer));

  return (
    <Screen testID="customer-detail-screen" title={customerFullName(customer)}>
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
        <Badge tone={segment.tone} label={t(segment.labelKey)} />
      </View>

      <Card title={t('customer.section.contact')}>
        <DetailRow label={t('customer.label.email')} value={customer.email || '—'} />
        {customer.phone ? (
          <DetailRow label={t('customer.label.phone')} value={customer.phone} />
        ) : null}
        <DetailRow label={t('customer.label.username')} value={customer.username} />
        <DetailRow label={t('customer.label.role')} value={customer.role} />
        <DetailRow label={t('customer.label.since')} value={fmt.date(customer.dateCreated)} />
      </Card>

      <Card title={t('customer.section.value')}>
        <DetailRow
          label={t('customer.label.totalSpent')}
          value={fmt.money(customer.totalSpent, customer.currency)}
        />
        <DetailRow label={t('customer.label.orders')} value={fmt.num(customer.ordersCount)} />
        <DetailRow
          label={t('customer.label.avgOrder')}
          value={fmt.money(averageOrderValue(customer), customer.currency)}
        />
        <DetailRow
          label={t('customer.label.lastOrder')}
          value={
            customer.lastOrderDate ? fmt.date(customer.lastOrderDate) : t('product.value.none')
          }
        />
        <DetailRow
          label={t('customer.label.segment')}
          value={<Badge tone={segment.tone} label={t(segment.labelKey)} />}
        />
      </Card>

      <Card title={t('customer.section.orders')}>
        <RecentOrders customer={customer} />
      </Card>

      <Card title={t('customer.section.marketing')}>
        <Text tone="muted" variant="caption">
          {t('customer.marketing.note')}
        </Text>
      </Card>
    </Screen>
  );
}
