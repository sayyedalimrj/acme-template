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
  ChartCard,
  DataList,
  Divider,
  EmptyState,
  ErrorState,
  HealthScoreBadge,
  LoadingState,
  MetricCard,
  MiniBars,
  Screen,
  StatusBadge,
  Text,
  type BadgeTone,
  type Column,
  type MiniBarDatum,
} from '@/components/ui';
import { stockBadge } from '@/features/products/productHelpers';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme, type ColorTokens } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import type { ActionItem, ActionSeverity, Order, SiteConnection, SiteStatus } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

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

/**
 * Dashboard KPI tile. Delegates to the shared MetricCard primitive (Ecme stat-widget) and
 * keeps the responsive sizing wrapper so the KPI row wraps fluidly on narrow screens.
 */
function KpiCard({ label, value, icon, tint, onPress }: KpiCardProps): React.JSX.Element {
  return (
    <View style={{ flexGrow: 1, flexBasis: 200, minWidth: 168 }}>
      <MetricCard label={label} value={value} icon={icon} tint={tint} onPress={onPress} />
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

const SITE_STATUS_META: Record<SiteStatus, { tone: BadgeTone; labelKey: StringKey; tint: Tint }> = {
  connected: { tone: 'success', labelKey: 'dashboard.storeStatus.connected', tint: 'success' },
  disconnected: {
    tone: 'neutral',
    labelKey: 'dashboard.storeStatus.disconnected',
    tint: 'warning',
  },
  pending: { tone: 'warning', labelKey: 'dashboard.storeStatus.pending', tint: 'warning' },
  error: { tone: 'danger', labelKey: 'dashboard.storeStatus.error', tint: 'danger' },
};

/**
 * Mock operational health score (0–100), derived deterministically from existing mock signals
 * (connection state, stock, fulfillment backlog). Presentation-only — there is no live backend.
 */
function computeStoreHealth(status: SiteStatus, outOfStock: number, low: number, unfulfilled: number): number {
  if (status === 'error') return 16;
  if (status === 'disconnected') return 34;
  let score = 100 - outOfStock * 5 - low * 1.5 - unfulfilled * 2;
  if (status === 'pending') score -= 18;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** A compact labelled stat used in the store-status hero. */
function MiniStat({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.xs, flexGrow: 1, flexBasis: 150, minWidth: 130 }}>
      <Text variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

/**
 * Store status / connection + plugin & sync health hero. Answers the first dashboard questions:
 * is the store connected, and is sync/plugin health okay — using the active SiteConnection.
 */
function StoreStatusHero({
  site,
  outOfStock,
  low,
  unfulfilled,
}: {
  site: SiteConnection;
  outOfStock: number;
  low: number;
  unfulfilled: number;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const meta = SITE_STATUS_META[site.status];
  const health = computeStoreHealth(site.status, outOfStock, low, unfulfilled);
  const lastSync = site.lastSyncedAt
    ? formatDate(site.lastSyncedAt)
    : t('dashboard.storeStatus.never');
  const platform =
    [site.wooVersion ? `Woo ${site.wooVersion}` : null, site.wpVersion ? `WP ${site.wpVersion}` : null]
      .filter(Boolean)
      .join(' · ') || '—';

  return (
    <Card contentStyle={{ gap: tokens.spacing.md }}>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.md,
            flex: 1,
            minWidth: 0,
          }}
        >
          <IconChip icon="globe-outline" tint={meta.tint} />
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Text variant="subheading" numberOfLines={1}>
              {site.name}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {site.url}
            </Text>
          </View>
        </View>
        <StatusBadge tone={meta.tone} label={t(meta.labelKey)} />
      </View>

      <Divider />

      <View
        style={{
          flexDirection: rowDirection,
          flexWrap: 'wrap',
          gap: tokens.spacing.md,
          alignItems: 'flex-start',
        }}
      >
        <MiniStat label={t('dashboard.storeStatus.syncHealth')}>
          <HealthScoreBadge
            score={health}
            labels={{
              healthy: t('health.healthy'),
              degraded: t('health.degraded'),
              critical: t('health.critical'),
            }}
          />
        </MiniStat>
        <MiniStat label={t('dashboard.storeStatus.lastSync')}>
          <Text variant="label">{lastSync}</Text>
        </MiniStat>
        <MiniStat label={t('dashboard.storeStatus.platform')}>
          <Text variant="label">{platform}</Text>
        </MiniStat>
      </View>

      <Text variant="caption" tone="muted">
        {t('dashboard.storeStatus.mockNote')}
      </Text>
    </Card>
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

  const fulfillmentBars: MiniBarDatum[] = [
    {
      label: t('dashboard.snapshot.unfulfilled'),
      value: data.fulfillment.unfulfilled,
      highlight: data.fulfillment.unfulfilled > 0,
    },
    { label: t('dashboard.snapshot.partial'), value: data.fulfillment.partial },
    { label: t('dashboard.snapshot.fulfilled'), value: data.fulfillment.fulfilled },
  ];

  // 4. Needs attention — the operating queue (what to handle today; deep-links to modules).
  const attention = (
    <Card
      title={t('dashboard.actionCenter')}
      headerAction={<Badge tone="neutral" label={formatNumber(sortedActions.length)} />}
      contentStyle={{ gap: 0 }}
    >
      <Text variant="caption" tone="muted" style={{ marginBottom: tokens.spacing.sm }}>
        {t('dashboard.attention.subtitle')}
      </Text>
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

  // 5. Fulfillment snapshot — a compact Ecme-style chart card from real fulfillment counts.
  const snapshot = (
    <ChartCard
      title={t('dashboard.snapshot.title')}
      subtitle={t('dashboard.snapshot.caption')}
      headerAction={
        <SectionLink label={t('fulfillment.title')} onPress={() => go('/fulfillment')} />
      }
    >
      <MiniBars height={116} data={fulfillmentBars} />
    </ChartCard>
  );

  const inventoryAlerts = (
    <Card
      title={t('dashboard.inventoryAlerts')}
      headerAction={<SectionLink label={t('nav.inventory')} onPress={() => go('/inventory')} />}
      contentStyle={{ gap: 0 }}
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
                  size={36}
                />
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Text variant="label" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
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
      contentStyle={{ gap: 0 }}
    >
      {data.topProducts.map((entry, index) => (
        <View key={entry.product.id}>
          {index > 0 ? <Divider /> : null}
          <ListRow onPress={() => go(`/products/${entry.product.id}`)}>
            <RankChip rank={index + 1} />
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
              <Text variant="label" numberOfLines={1}>
                {entry.product.name}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {entry.product.sku} · {formatNumber(entry.unitsSold)} {t('orders.items')}
              </Text>
            </View>
            <Text variant="label">{formatCurrency(entry.revenue, data.currency)}</Text>
          </ListRow>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen testID="dashboard-screen">
      {/* Page header */}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <View style={{ gap: tokens.spacing.xs, flex: 1 }}>
          <Text variant="title">{t('dashboard.title')}</Text>
          <Text tone="muted">
            {t('dashboard.activeStore')}: {activeSite.data?.name ?? '—'}
          </Text>
        </View>
        <SectionLink label={t('dashboard.reports')} onPress={() => go('/reports')} />
      </View>

      {/* 1. Store status / connection + plugin & sync health */}
      {activeSite.data ? (
        <StoreStatusHero
          site={activeSite.data}
          outOfStock={data.outOfStockCount}
          low={data.lowStockCount}
          unfulfilled={data.fulfillment.unfulfilled}
        />
      ) : null}

      {/* 2. KPI strip (4 compact stat cards) */}
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
      </View>

      {/* 3. Operating workflow: attention + orders (main) beside snapshot + lists (rail). */}
      <View
        style={{
          flexDirection: twoCol ? rowDirection : 'column',
          gap: tokens.spacing.lg,
          alignItems: 'stretch',
        }}
      >
        <View style={{ flex: twoCol ? 2 : undefined, gap: tokens.spacing.lg, minWidth: 0 }}>
          {attention}
          {recentOrders}
        </View>
        <View style={{ flex: twoCol ? 1 : undefined, gap: tokens.spacing.lg, minWidth: 0 }}>
          {snapshot}
          {inventoryAlerts}
          {topProducts}
        </View>
      </View>
    </Screen>
  );
}

