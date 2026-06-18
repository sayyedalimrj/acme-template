/**
 * PaymentsScreen — the store's payments / sales view (mobile-first).
 *
 * Shows the merchant's own incoming payments (derived from mock orders): a received/pending
 * summary, a search field, and a tidy list of payment rows (order number, customer, method,
 * date, amount, status chip). This is the "payments / sales" section — distinct from the
 * subscription/plans screen. Mock-only; no real payment provider, no backend writes. RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import {
  AnimatedSection,
  EmptySiteCard,
  MobilePage,
  MobileSearchField,
  MobileTabHeader,
  PressableScale,
  StatusBadge,
  type StatusTone,
} from '@/features/mobile/components';
import { useOrders } from '@/features/orders/useOrders';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import { mobileMetrics, mobileType, useMobileColors, useMobileShadow } from '@/features/mobile/mobileTokens';
import type { Order, OrderStatus } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';

function paymentStatus(status: OrderStatus): PaymentStatus {
  switch (status) {
    case 'completed':
    case 'processing':
      return 'paid';
    case 'pending':
    case 'on-hold':
      return 'pending';
    case 'refunded':
      return 'refunded';
    default:
      return 'failed';
  }
}

const STATUS_META: Record<PaymentStatus, { tone: StatusTone; labelKey: StringKey }> = {
  paid: { tone: 'success', labelKey: 'payments.status.paid' },
  pending: { tone: 'warning', labelKey: 'payments.status.pending' },
  refunded: { tone: 'neutral', labelKey: 'payments.status.refunded' },
  failed: { tone: 'danger', labelKey: 'payments.status.failed' },
};

function customerLabel(order: Order, fallback: string): string {
  const name = `${order.billing.firstName} ${order.billing.lastName}`.trim();
  return name.length > 0 ? name : fallback;
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning';
}): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const { isRTL } = useTheme();
  const color =
    tone === 'success'
      ? colors.statusActive
      : tone === 'warning'
        ? colors.statusAttention
        : colors.primary;
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 0,
          borderRadius: mobileMetrics.cardRadiusSmall,
          backgroundColor: colors.card,
          padding: 14,
          gap: 6,
        },
        shadow,
      ]}
    >
      <Text
        style={{ fontSize: mobileType.captionSize, color: colors.textSecondary }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color, textAlign: isRTL ? 'right' : 'left' }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function PaymentRow({
  order,
  customerFallback,
  onPress,
}: {
  order: Order;
  customerFallback: string;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, isRTL } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const meta = STATUS_META[paymentStatus(order.status)];

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
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: colors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="card-outline" size={20} color={colors.primary} />
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <Text
            style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}
            numberOfLines={1}
          >
            {t('payments.forOrder')} #{order.number}
          </Text>
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
          <StatusBadge tone={meta.tone} label={t(meta.labelKey)} />
          <View style={{ flex: 1 }} />
          <Text
            style={{ fontSize: mobileType.captionSize, color: colors.mutedSoft }}
            numberOfLines={1}
          >
            {fmt.date(order.dateCreated)}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

function SectionTitle({ title }: { title: string }): React.JSX.Element {
  return <MobileTabHeader title={title} />;
}

export function PaymentsScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const t = useT();
  const router = useRouter();
  const fmt = useFormatters();
  const { isRTL } = useTheme();

  const activeSite = useActiveSite();
  const ordersQuery = useOrders();

  const [search, setSearch] = useState('');

  const items = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((order) =>
      [order.number, `${order.billing.firstName} ${order.billing.lastName}`]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [items, search]);

  const summary = useMemo(() => {
    let received = 0;
    let pending = 0;
    for (const order of items) {
      const amount = Number.parseFloat(order.total) || 0;
      const status = paymentStatus(order.status);
      if (status === 'paid') {
        received += amount;
      } else if (status === 'pending') {
        pending += amount;
      }
    }
    const currency = items[0]?.currency ?? 'USD';
    return {
      received: fmt.money(String(received), currency),
      pending: fmt.money(String(pending), currency),
      count: items.length,
    };
  }, [items, fmt]);

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <MobilePage testID="payments-screen" header={<SectionTitle title={t('payments.title')} />}>
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
    <MobilePage testID="payments-screen" header={<SectionTitle title={t('payments.title')} />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16 }}>
        <AnimatedSection index={0}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12 }}>
            <SummaryTile label={t('payments.summary.received')} value={summary.received} tone="success" />
            <SummaryTile label={t('payments.summary.pending')} value={summary.pending} tone="warning" />
            <SummaryTile
              label={t('payments.summary.count')}
              value={fmt.num(summary.count)}
              tone="primary"
            />
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <MobileSearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t('payments.searchPlaceholder')}
            testID="payment-search"
          />
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
              {t('payments.error')} · {t('common.retry')}
            </Text>
          </PressableScale>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="card-outline" size={34} color={colors.mutedSoft} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>{t('payments.empty')}</Text>
          </View>
        ) : (
          <AnimatedSection index={2}>
            <Text
              style={{
                fontSize: mobileType.sectionSize,
                fontWeight: '700',
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
                marginBottom: 4,
              }}
            >
              {t('payments.recent')}
            </Text>
            <View
              testID="payment-list"
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
                  <PaymentRow
                    order={order}
                    customerFallback={t('orders.customerFallback')}
                    onPress={() => router.navigate(`/orders/${order.id}` as never)}
                  />
                </View>
              ))}
            </View>
            <Text
              style={{
                fontSize: mobileType.captionSize,
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 14,
              }}
            >
              {t('payments.mockNote')}
            </Text>
          </AnimatedSection>
        )}
      </View>
    </MobilePage>
  );
}
