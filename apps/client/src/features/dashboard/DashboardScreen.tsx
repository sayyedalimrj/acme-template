/**
 * Dashboard overview screen.
 *
 * Composes KPI metric cards, a recent-orders list, and a top-products list from mocked,
 * WooCommerce-like data. Handles loading, error (with retry), and empty states. Layout is
 * responsive and direction-aware; all elements use RN primitives and theme tokens.
 *
 * Visual structure is inspired by Ecme's e-commerce dashboard (KPI row + lists) but is an
 * original implementation — no Ecme code is ported.
 */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import {
  Badge,
  Card,
  DataList,
  ErrorState,
  LoadingState,
  Screen,
  Text,
  type Column,
} from '@/components/ui';
import type { Order, TopProductEntry } from '@/domain/types';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';

import { orderStatusLabel, orderStatusTone } from './status';
import { useDashboard } from './useDashboard';

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps): React.JSX.Element {
  // flexGrow + flexBasis lets cards wrap responsively (4-up on wide web, fewer when
  // narrow) without manual breakpoint math, and avoids percentage+gap overflow.
  return (
    <View style={{ flexGrow: 1, flexBasis: 200, minWidth: 150 }}>
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
    </View>
  );
}

export function DashboardScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const { data, isPending, isError, refetch, isFetching } = useDashboard();

  const gap = tokens.spacing.md;

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

  const locale = 'en';

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
      flex: 1.2,
      render: (o) => <Badge tone={orderStatusTone(o.status)} label={orderStatusLabel(o.status)} />,
    },
    {
      key: 'total',
      header: t('dashboard.col.total'),
      flex: 1,
      align: 'end',
      render: (o) => <Text variant="label">{formatCurrency(o.total, o.currency, locale)}</Text>,
    },
    {
      key: 'date',
      header: t('dashboard.col.date'),
      flex: 1.2,
      align: 'end',
      render: (o) => (
        <Text tone="muted" variant="caption">
          {formatDate(o.dateCreated, locale)}
        </Text>
      ),
    },
  ];

  const topProductColumns: Column<TopProductEntry>[] = [
    {
      key: 'product',
      header: t('dashboard.col.product'),
      flex: 2,
      render: (entry) => <Text numberOfLines={1}>{entry.product.name}</Text>,
    },
    {
      key: 'sku',
      header: t('dashboard.col.sku'),
      flex: 1.2,
      render: (entry) => (
        <Text tone="muted" variant="caption">
          {entry.product.sku}
        </Text>
      ),
    },
    {
      key: 'sold',
      header: t('dashboard.col.sold'),
      flex: 0.8,
      align: 'end',
      render: (entry) => <Text variant="label">{formatNumber(entry.unitsSold, locale)}</Text>,
    },
    {
      key: 'revenue',
      header: t('dashboard.col.revenue'),
      flex: 1,
      align: 'end',
      render: (entry) => (
        <Text variant="label">{formatCurrency(entry.revenue, data.currency, locale)}</Text>
      ),
    },
  ];

  return (
    <Screen testID="dashboard-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('dashboard.title')}</Text>
        <Text tone="muted">{t('dashboard.subtitle')}</Text>
      </View>

      {/* KPI metrics */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        <MetricCard
          label={t('dashboard.metric.sales')}
          value={formatCurrency(data.salesTotal, data.currency, locale)}
        />
        <MetricCard
          label={t('dashboard.metric.orders')}
          value={formatNumber(data.ordersCount, locale)}
        />
        <MetricCard
          label={t('dashboard.metric.products')}
          value={formatNumber(data.productsCount, locale)}
        />
        <MetricCard
          label={t('dashboard.metric.customers')}
          value={formatNumber(data.customersCount, locale)}
        />
      </View>

      {/* Recent orders */}
      <Card
        title={t('dashboard.recentOrders')}
        headerAction={
          isFetching ? <ActivityIndicator size="small" color={tokens.color.textMuted} /> : null
        }
      >
        <DataList<Order>
          data={data.recentOrders}
          columns={orderColumns}
          keyExtractor={(o) => o.id}
          emptyLabel={t('dashboard.empty')}
          testID="recent-orders"
        />
      </Card>

      {/* Top products */}
      <Card title={t('dashboard.topProducts')}>
        <DataList<TopProductEntry>
          data={data.topProducts}
          columns={topProductColumns}
          keyExtractor={(entry) => entry.product.id}
          emptyLabel={t('dashboard.empty')}
          testID="top-products"
        />
      </Card>
    </Screen>
  );
}
