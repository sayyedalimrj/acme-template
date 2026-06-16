/**
 * Dashboard — operational commerce home.
 *
 * The store's operating home: store-pulse KPIs, an action center (urgent items with
 * severity treatment), recent orders, inventory alerts, top products, and a customer
 * signal. Every actionable row deep-links into the existing Products/Orders/Customers/
 * Connect-Site screens via Expo Router. Mock-only via DashboardService; no real APIs.
 *
 * Visual structure is inspired by mature commerce admin homes (Shopify/Wix/Squarespace)
 * but is an original RN implementation — no Ecme code is ported, no charts/heavy deps.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
  type BadgeTone,
} from '@/components/ui';
import { fulfillmentBadge } from '@/features/orders/orderHelpers';
import { stockBadge } from '@/features/products/productHelpers';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import type { ActionItem, ActionSeverity, Order, Product } from '@/domain/types';

import { orderStatusLabel, orderStatusTone } from './status';
import { useDashboard } from './useDashboard';

const SEVERITY_TONE: Record<ActionSeverity, BadgeTone> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};

const SEVERITY_RANK: Record<ActionSeverity, number> = { critical: 0, warning: 1, info: 2 };

function entityRoute(entity: ActionItem['entity']): string | null {
  if (!entity) return null;
  switch (entity.kind) {
    case 'product':
      return `/products/${entity.id}`;
    case 'order':
      return `/orders/${entity.id}`;
    case 'customer':
      return `/customers/${entity.id}`;
    default:
      return null;
  }
}

function usePressableRowStyle(): ViewStyle {
  const { tokens, rowDirection } = useTheme();
  return {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  };
}

// --- KPI ---------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  onPress?: () => void;
}

function KpiCard({ label, value, onPress }: KpiCardProps): React.JSX.Element {
  const content = (
    <Card>
      <Text
        variant="caption"
        tone="muted"
        style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      <Text variant="display">{value}</Text>
    </Card>
  );
  return (
    <View style={{ flexGrow: 1, flexBasis: 180, minWidth: 150 }}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

// --- Section header link ------------------------------------------------------

function SectionLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: rowDirection, alignItems: 'center', gap: 2 }}
    >
      <Text variant="caption" tone="primary">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={tokens.color.primary} />
    </Pressable>
  );
}

// --- Action center ------------------------------------------------------------

function ActionRow({
  item,
  onPress,
}: {
  item: ActionItem;
  onPress?: () => void;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const tone = SEVERITY_TONE[item.severity];
  const accent =
    tokens.color[tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'primary'];

  const body = (
    <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.md }}>
      <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: accent }} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
          <Text variant="label">{item.title}</Text>
          <Badge tone={tone} label={item.severity} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View style={{ paddingVertical: tokens.spacing.sm }}>{body}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [
        { paddingVertical: tokens.spacing.sm, borderRadius: tokens.radius.sm },
        pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      {body}
    </Pressable>
  );
}

// --- Generic pressable list row ----------------------------------------------

function ListRow({
  onPress,
  children,
}: {
  onPress: () => void;
  children: ReactNode;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const rowStyle = usePressableRowStyle();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        { borderRadius: tokens.radius.sm },
        pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function DashboardScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const activeSite = useActiveSite();
  const { data, isPending, isError, refetch } = useDashboard();

  // No active site → guide to Connect Site (mirrors the feature screens).
  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('dashboard.noSite.title')}
          body={t('dashboard.noSite.body')}
          icon="storefront-outline"
          action={{ label: t('site.connectCta'), onPress: () => go('/connect-site') }}
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

  if (isError || !data) {
    return (
      <Screen scroll={false} padded={false}>
        <ErrorState
          title={t('dashboard.error')}
          body={t('dashboard.empty')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const aov =
    data.ordersCount > 0
      ? (Number.parseFloat(data.salesTotal) / data.ordersCount).toFixed(2)
      : '0.00';

  const sortedActions = [...data.actionItems].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );

  return (
    <Screen testID="dashboard-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('dashboard.title')}</Text>
        <Text tone="muted">
          {t('dashboard.activeStore')}: {activeSite.data?.name ?? '—'}
        </Text>
      </View>

      {/* A. Store pulse / KPIs */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
        <KpiCard
          label={t('dashboard.metric.sales')}
          value={formatCurrency(data.salesTotal, data.currency)}
        />
        <KpiCard
          label={t('dashboard.metric.orders')}
          value={formatNumber(data.ordersCount)}
          onPress={() => go('/orders')}
        />
        <KpiCard
          label={t('dashboard.metric.products')}
          value={formatNumber(data.productsCount)}
          onPress={() => go('/products')}
        />
        <KpiCard
          label={t('dashboard.metric.customers')}
          value={formatNumber(data.customersCount)}
          onPress={() => go('/customers')}
        />
        <KpiCard label={t('dashboard.metric.aov')} value={formatCurrency(aov, data.currency)} />
      </View>

      {/* B. Action center */}
      <Card title={t('dashboard.actionCenter')}>
        {sortedActions.length === 0 ? (
          <Text tone="muted">{t('dashboard.actionCenter.empty')}</Text>
        ) : (
          sortedActions.map((item, index) => {
            const route = entityRoute(item.entity);
            return (
              <View key={item.id}>
                {index > 0 ? <Divider /> : null}
                <ActionRow item={item} onPress={route ? () => go(route) : undefined} />
              </View>
            );
          })
        )}
      </Card>

      {/* C. Recent orders */}
      <Card
        title={t('dashboard.recentOrders')}
        headerAction={
          <SectionLink label={t('dashboard.viewAllOrders')} onPress={() => go('/orders')} />
        }
      >
        {data.recentOrders.map((order: Order, index) => {
          const fulfillment = fulfillmentBadge(order.fulfillment);
          return (
            <View key={order.id}>
              {index > 0 ? <Divider /> : null}
              <ListRow onPress={() => go(`/orders/${order.id}`)}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label">#{order.number}</Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {order.billing.firstName} {order.billing.lastName} ·{' '}
                    {formatDate(order.dateCreated)}
                  </Text>
                  <View
                    style={{
                      flexDirection: rowDirection,
                      gap: tokens.spacing.xs,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Badge
                      tone={orderStatusTone(order.status)}
                      label={orderStatusLabel(order.status)}
                    />
                    <Badge tone={fulfillment.tone} label={t(fulfillment.labelKey)} />
                  </View>
                </View>
                <Text variant="label">{formatCurrency(order.total, order.currency)}</Text>
                <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
              </ListRow>
            </View>
          );
        })}
      </Card>

      {/* D. Inventory alerts */}
      <Card
        title={t('dashboard.inventoryAlerts')}
        headerAction={
          <SectionLink label={t('dashboard.viewAllProducts')} onPress={() => go('/products')} />
        }
      >
        {data.inventoryAlerts.length === 0 ? (
          <Text tone="muted">{t('dashboard.inventory.empty')}</Text>
        ) : (
          data.inventoryAlerts.map((product: Product, index) => {
            const stock = stockBadge(product);
            return (
              <View key={product.id}>
                {index > 0 ? <Divider /> : null}
                <ListRow onPress={() => go(`/products/${product.id}`)}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="label" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {product.sku}
                    </Text>
                  </View>
                  <Badge tone={stock.tone} label={t(stock.labelKey)} />
                  {typeof product.stockQuantity === 'number' ? (
                    <Text variant="caption" tone="muted">
                      {formatNumber(product.stockQuantity)}
                    </Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
                </ListRow>
              </View>
            );
          })
        )}
      </Card>

      {/* E. Top products */}
      <Card
        title={t('dashboard.topProducts')}
        headerAction={
          <SectionLink label={t('dashboard.viewAllProducts')} onPress={() => go('/products')} />
        }
      >
        {data.topProducts.map((entry, index) => (
          <View key={entry.product.id}>
            {index > 0 ? <Divider /> : null}
            <ListRow onPress={() => go(`/products/${entry.product.id}`)}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="label" numberOfLines={1}>
                  {entry.product.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {entry.product.sku} · {formatNumber(entry.unitsSold)} {t('orders.items')}
                </Text>
              </View>
              <Text variant="label">{formatCurrency(entry.revenue, data.currency)}</Text>
              <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
            </ListRow>
          </View>
        ))}
      </Card>

      {/* F. Customer signal */}
      <Card
        title={t('dashboard.customers.title')}
        headerAction={
          <SectionLink label={t('dashboard.viewAllCustomers')} onPress={() => go('/customers')} />
        }
      >
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: tokens.spacing.xs,
          }}
        >
          <Text variant="label" tone="muted">
            {t('dashboard.customers.total')}
          </Text>
          <Text variant="label">{formatNumber(data.customersCount)}</Text>
        </View>
        {data.abandonedCarts ? (
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: tokens.spacing.xs,
            }}
          >
            <Text variant="label" tone="muted">
              {t('dashboard.customers.abandoned')}
            </Text>
            <Text variant="label">
              {formatNumber(data.abandonedCarts.count)} ·{' '}
              {formatCurrency(data.abandonedCarts.recoverableValue, data.abandonedCarts.currency)}
            </Text>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
