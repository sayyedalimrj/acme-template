/**
 * Order detail screen.
 *
 * Read-only operational view of a single order: status/payment/fulfillment, customer,
 * billing, shipping, line items, and totals. Future operator actions (update status, mark
 * fulfilled, add tracking) are shown as clearly-disabled placeholders — no mutations here.
 * Active-site-aware via `useOrder`.
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
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import type { Order } from '@/domain/types';

import { fulfillmentBadge, needsAttention, orderStatusBadge, paymentBadge } from './orderHelpers';
import { useOrder } from './useOrders';

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

function LineItems({ order }: { order: Order }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      {order.lineItems.map((item, index) => (
        <View key={item.id} style={{ gap: tokens.spacing.sm }}>
          {index > 0 ? <Divider /> : null}
          <View style={{ flexDirection: rowDirection, gap: tokens.spacing.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label" numberOfLines={2}>
                {item.name}
              </Text>
              <Text variant="caption" tone="muted">
                {item.sku} · {t('order.label.qty')} {formatNumber(item.quantity)} ×{' '}
                {formatCurrency(item.price, order.currency)}
              </Text>
            </View>
            <Text variant="label">{formatCurrency(item.total, order.currency)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();

  const activeSite = useActiveSite();
  const { data: order, isPending, isError, refetch } = useOrder(orderId);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/orders' as never);
    }
  };

  const BackLink = (
    <Pressable
      accessibilityRole="button"
      onPress={goBack}
      style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}
    >
      <Ionicons name="chevron-back" size={18} color={tokens.color.primary} />
      <Text variant="label" tone="primary">
        {t('order.back')}
      </Text>
    </Pressable>
  );

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

  if (isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError || !order) {
    return (
      <Screen testID="order-detail-screen">
        {BackLink}
        <ErrorState
          title={t('order.notFound.title')}
          body={t('order.notFound.body')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  const status = orderStatusBadge(order.status);
  const payment = paymentBadge(order.status);
  const fulfillment = fulfillmentBadge(order.fulfillment);
  const none = t('product.value.none');
  const billing = order.billing;
  const shipping = order.shipping;

  return (
    <Screen testID="order-detail-screen">
      {BackLink}

      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">#{order.number}</Text>
        <Text variant="caption" tone="muted">
          {formatDate(order.dateCreated)}
        </Text>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
          <Badge tone={status.tone} label={t(status.labelKey)} />
          <Badge tone={payment.tone} label={t(payment.labelKey)} />
          <Badge tone={fulfillment.tone} label={t(fulfillment.labelKey)} />
          {needsAttention(order) ? <Badge tone="danger" label={t('orders.attention')} /> : null}
        </View>
      </View>

      {/* Future actions — clearly disabled placeholders (no mutations yet). */}
      <Card title={t('order.section.actions')}>
        <Text tone="muted" variant="caption">
          {t('order.actions.note')}
        </Text>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
          <Button label={t('order.action.updateStatus')} variant="secondary" size="sm" disabled />
          <Button label={t('order.action.markFulfilled')} variant="secondary" size="sm" disabled />
          <Button label={t('order.action.addTracking')} variant="secondary" size="sm" disabled />
        </View>
      </Card>

      <Card title={t('order.section.customer')}>
        <DetailRow
          label={t('order.section.customer')}
          value={`${billing.firstName} ${billing.lastName}`}
        />
        <DetailRow label={t('order.label.email')} value={billing.email} />
        <DetailRow label={t('order.label.phone')} value={billing.phone ?? none} />
      </Card>

      <Card title={t('order.section.billing')}>
        <DetailRow label={t('order.label.paymentMethod')} value={order.paymentMethodTitle} />
        <DetailRow
          label={t('order.section.billing')}
          value={
            [billing.address1, billing.city, billing.postcode, billing.country]
              .filter(Boolean)
              .join(', ') || none
          }
        />
      </Card>

      <Card title={t('order.section.shipping')}>
        <DetailRow label={t('order.label.shippingMethod')} value={shipping?.method ?? none} />
        <DetailRow label={t('order.label.carrier')} value={shipping?.carrier ?? none} />
        <DetailRow label={t('order.label.tracking')} value={shipping?.trackingNumber ?? none} />
        <DetailRow
          label={t('order.label.shippedAt')}
          value={shipping?.shippedAt ? formatDate(shipping.shippedAt) : none}
        />
        <DetailRow
          label={t('order.label.eta')}
          value={shipping?.estimatedDelivery ? formatDate(shipping.estimatedDelivery) : none}
        />
      </Card>

      <Card title={t('order.section.items')}>
        <LineItems order={order} />
      </Card>

      <Card title={t('order.section.totals')}>
        <DetailRow
          label={t('order.label.subtotal')}
          value={formatCurrency(order.subtotal, order.currency)}
        />
        <DetailRow
          label={t('order.label.shippingTotal')}
          value={formatCurrency(order.shippingTotal, order.currency)}
        />
        <DetailRow
          label={t('order.label.tax')}
          value={formatCurrency(order.totalTax, order.currency)}
        />
        <DetailRow
          label={t('order.label.discount')}
          value={formatCurrency(order.discountTotal, order.currency)}
        />
        {order.couponCodes && order.couponCodes.length > 0 ? (
          <DetailRow label={t('order.label.coupons')} value={order.couponCodes.join(', ')} />
        ) : null}
        <Divider spacing="xs" />
        <DetailRow
          label={t('order.label.total')}
          value={<Text variant="subheading">{formatCurrency(order.total, order.currency)}</Text>}
        />
      </Card>
    </Screen>
  );
}
