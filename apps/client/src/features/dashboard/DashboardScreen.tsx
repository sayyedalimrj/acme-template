/**
 * Dashboard — operational commerce home (Ecme-style).
 *
 * Layout: a KPI stat-widget row, then a two-column admin grid on wide screens — a main
 * column (action center + recent-orders table) beside a right rail (inventory alerts, top
 * products, customer signal). Single column on narrow/native. Every actionable row deep-links
 * into the existing modules via Expo Router. Mock-only via DashboardService; no real APIs.
 *
 * Visual language is rebuilt from Ecme's ecommerce dashboard (stat cards with circular icon
 * chips, a recent-orders table, rail widgets) using RN primitives + tokens. No charts/deps.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import {
  Badge,
  Card,
  DataList,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
  type Column,
} from '@/components/ui';
import { stockBadge } from '@/features/products/productHelpers';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme, type ColorTokens } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import type { ActionItem, ActionSeverity, Order } from '@/domain/types';

import { orderStatusLabel, orderStatusTone } from './status';
import { useDashboard } from './useDashboard';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type Tint = 'primary' | 'success' | 'warning' | 'info' | 'danger';

const TINT: Record<Tint, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  primary: { bg: 'primarySoft', fg: 'primary' },
  success: { bg: 'successSoft', fg: 'success' },
  warning: { bg: 'warningSoft', fg: 'warning' },
  info: { bg: 'infoSoft', fg: 'info' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
};

const SEVERITY_TINT: Record<ActionSeverity, Tint> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};

const SEVERITY_ICON: Record<ActionSeverity, IoniconName> = {
  critical: 'alert-circle-outline',
  warning: 'warning-outline',
  info: 'information-circle-outline',
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

/** Circular tinted icon chip (Ecme stat/list iconography). */
function IconChip({
  icon,
  tint,
  size = 44,
}: {
  icon: IoniconName;
  tint: Tint;
  size?: number;
}): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color[TINT[tint].bg],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color={tokens.color[TINT[tint].fg]} />
    </View>
  );
}

function RankChip({ rank }: { rank: number }): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label" tone="primary" style={{ fontWeight: '700' }}>
        {rank}
      </Text>
    </View>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: IoniconName;
  tint: Tint;
  onPress?: () => void;
}

function KpiCard({ label, value, icon, tint, onPress }: KpiCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hovered, setHovered] = useState(false);
  const content = (
    <Card
      contentStyle={{ gap: 0 }}
      style={hovered ? { borderColor: tokens.color.borderStrong } : undefined}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: tokens.spacing.xs }}>
          <Text
            variant="caption"
            tone="muted"
            style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}
          >
            {label}
          </Text>
          <Text variant="title" numberOfLines={1}>
            {value}
          </Text>
        </View>
        <IconChip icon={icon} tint={tint} />
      </View>
    </Card>
  );
  return (
    <View style={{ flexGrow: 1, flexBasis: 200, minWidth: 168 }}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

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
      <Text variant="caption" tone="primary" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={tokens.color.primary} />
    </Pressable>
  );
}

function ActionRow({
  item,
  onPress,
}: {
  item: ActionItem;
  onPress?: () => void;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hovered, setHovered] = useState(false);
  const tint = SEVERITY_TINT[item.severity];

  const body = (
    <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.md }}>
      <IconChip icon={SEVERITY_ICON[item.severity]} tint={tint} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{item.title}</Text>
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
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        {
          paddingVertical: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.sm,
          borderRadius: tokens.radius.md,
        },
        hovered || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      {body}
    </Pressable>
  );
}

function ListRow({
  onPress,
  children,
}: {
  onPress: () => void;
  children: ReactNode;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.sm,
          borderRadius: tokens.radius.md,
        },
        hovered || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
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
  const { width } = useWindowDimensions();
  const twoCol = width >= 1024;

  const activeSite = useActiveSite();
  const { data, isPending, isError, refetch } = useDashboard();

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

  const orderColumns: Column<Order>[] = [
    {
      key: 'number',
      header: t('dashboard.col.order'),
      flex: 1,
      render: (o) => <Text variant="label">#{o.number}</Text>,
    },
    {
      key: 'customer',
      header: t('dashboard.col.customer'),
      flex: 1.6,
      render: (o) => (
        <Text numberOfLines={1}>
          {o.billing.firstName} {o.billing.lastName}
        </Text>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.col.status'),
      flex: 1.3,
      render: (o) => <Badge tone={orderStatusTone(o.status)} label={orderStatusLabel(o.status)} />,
    },
    {
      key: 'total',
      header: t('dashboard.col.total'),
      flex: 1,
      align: 'end',
      render: (o) => <Text variant="label">{formatCurrency(o.total, o.currency)}</Text>,
    },
    {
      key: 'date',
      header: t('dashboard.col.date'),
      flex: 1.2,
      align: 'end',
      render: (o) => (
        <Text variant="caption" tone="muted">
          {formatDate(o.dateCreated)}
        </Text>
      ),
    },
  ];

  const actionCenter = (
    <Card
      title={t('dashboard.actionCenter')}
      headerAction={<Badge tone="neutral" label={formatNumber(sortedActions.length)} />}
    >
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
  );

  const recentOrders = (
    <Card
      title={t('dashboard.recentOrders')}
      headerAction={
        <SectionLink label={t('dashboard.viewAllOrders')} onPress={() => go('/orders')} />
      }
    >
      <DataList<Order>
        data={data.recentOrders}
        columns={orderColumns}
        keyExtractor={(o) => o.id}
        emptyLabel={t('dashboard.empty')}
      />
    </Card>
  );

  const inventoryAlerts = (
    <Card
      title={t('dashboard.inventoryAlerts')}
      headerAction={
        <SectionLink label={t('dashboard.viewAllProducts')} onPress={() => go('/products')} />
      }
    >
      {data.inventoryAlerts.length === 0 ? (
        <Text tone="muted">{t('dashboard.inventory.empty')}</Text>
      ) : (
        data.inventoryAlerts.map((product, index) => {
          const stock = stockBadge(product);
          return (
            <View key={product.id}>
              {index > 0 ? <Divider /> : null}
              <ListRow onPress={() => go(`/products/${product.id}`)}>
                <IconChip
                  icon="cube-outline"
                  tint={product.stockStatus === 'outofstock' ? 'danger' : 'warning'}
                  size={40}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {product.sku}
                  </Text>
                </View>
                <Badge tone={stock.tone} label={t(stock.labelKey)} />
              </ListRow>
            </View>
          );
        })
      )}
    </Card>
  );

  const topProducts = (
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
            <RankChip rank={index + 1} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label" numberOfLines={1}>
                {entry.product.name}
              </Text>
              <Text variant="caption" tone="muted">
                {entry.product.sku} · {formatNumber(entry.unitsSold)} {t('orders.items')}
              </Text>
            </View>
            <Text variant="label">{formatCurrency(entry.revenue, data.currency)}</Text>
          </ListRow>
        </View>
      ))}
    </Card>
  );

  const customerSignal = (
    <Card
      title={t('dashboard.customers.title')}
      headerAction={
        <SectionLink label={t('dashboard.viewAllCustomers')} onPress={() => go('/customers')} />
      }
    >
      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.md }}>
        <IconChip icon="people-outline" tint="warning" size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="muted">
            {t('dashboard.customers.total')}
          </Text>
          <Text variant="heading">{formatNumber(data.customersCount)}</Text>
        </View>
      </View>
      {data.abandonedCarts ? (
        <>
          <Divider />
          <View
            style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.md }}
          >
            <IconChip icon="cart-outline" tint="info" size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="caption" tone="muted">
                {t('dashboard.customers.abandoned')}
              </Text>
              <Text variant="heading">
                {formatNumber(data.abandonedCarts.count)} ·{' '}
                {formatCurrency(data.abandonedCarts.recoverableValue, data.abandonedCarts.currency)}
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </Card>
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
          icon="cash-outline"
          tint="success"
        />
        <KpiCard
          label={t('dashboard.metric.orders')}
          value={formatNumber(data.ordersCount)}
          icon="receipt-outline"
          tint="info"
          onPress={() => go('/orders')}
        />
        <KpiCard
          label={t('dashboard.metric.products')}
          value={formatNumber(data.productsCount)}
          icon="pricetags-outline"
          tint="primary"
          onPress={() => go('/products')}
        />
        <KpiCard
          label={t('dashboard.metric.customers')}
          value={formatNumber(data.customersCount)}
          icon="people-outline"
          tint="warning"
          onPress={() => go('/customers')}
        />
        <KpiCard
          label={t('dashboard.metric.aov')}
          value={formatCurrency(aov, data.currency)}
          icon="trending-up-outline"
          tint="primary"
        />
      </View>

      {/* Two-column admin grid (main + right rail) on wide; stacked on narrow. */}
      <View
        style={{
          flexDirection: twoCol ? rowDirection : 'column',
          gap: tokens.spacing.lg,
          alignItems: 'stretch',
        }}
      >
        <View style={{ flex: twoCol ? 2 : undefined, gap: tokens.spacing.lg, minWidth: 0 }}>
          {actionCenter}
          {recentOrders}
        </View>
        <View style={{ flex: twoCol ? 1 : undefined, gap: tokens.spacing.lg, minWidth: 0 }}>
          {inventoryAlerts}
          {topProducts}
          {customerSignal}
        </View>
      </View>
    </Screen>
  );
}
