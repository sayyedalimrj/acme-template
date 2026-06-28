/**
 * Customer detail screen — merchant-facing profile with value signals and recent orders.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import {
  Badge,
  Button,
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
  const { tokens, rowDirection, isRTL } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const orders = customer.recentOrders ?? [];

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title={t('customer.orders.empty')}
        fill={false}
      />
    );
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
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={tokens.color.textMuted}
              />
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
  const name = customerFullName(customer);

  return (
    <Screen testID="customer-detail-screen" title={name || t('customer.fallbackName')}>
      <Card>
        <View style={{ gap: tokens.spacing.sm }}>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
            <Text variant="heading" testID="customer-detail-name">
              {name || t('customer.fallbackName')}
            </Text>
            <Badge tone={segment.tone} label={t(segment.labelKey)} />
          </View>
          {customer.phone ? (
            <Text variant="label">{customer.phone}</Text>
          ) : null}
          {customer.email ? (
            <Text variant="caption" tone="muted">
              {customer.email}
            </Text>
          ) : null}
          {customer.username ? (
            <Text variant="caption" tone="muted">
              {t('customer.label.username')}: {customer.username}
            </Text>
          ) : null}
        </View>
      </Card>

      <Card title={t('customer.section.value')}>
        <DetailRow label={t('customer.label.since')} value={fmt.date(customer.dateCreated)} />
        <DetailRow label={t('customer.label.orders')} value={fmt.num(customer.ordersCount)} />
        <DetailRow
          label={t('customer.label.totalSpent')}
          value={fmt.money(customer.totalSpent, customer.currency)}
        />
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
      </Card>

      <Card title={t('customer.section.actions')}>
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
          <Button label={t('customer.action.message')} variant="secondary" size="sm" disabled />
          <Button
            label={t('customer.action.viewOrders')}
            variant="secondary"
            size="sm"
            onPress={() => router.navigate('/orders' as never)}
          />
          <Button label={t('customer.action.addNote')} variant="secondary" size="sm" disabled />
        </View>
      </Card>

      <Card title={t('customer.section.orders')}>
        <RecentOrders customer={customer} />
      </Card>
    </Screen>
  );
}
