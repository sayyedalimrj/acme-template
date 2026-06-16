/**
 * Inventory alerts screen.
 *
 * An operational, inventory-first view of products needing restock attention (out of stock,
 * backordered, low stock), prioritized and deep-linking to product detail. Active-site-aware
 * via `useProducts`; read-only (no stock mutations). Mock-only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, type ComponentProps, type ReactNode } from 'react';
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
import { stockBadge } from '@/features/products/productHelpers';
import { useProducts } from '@/features/products/useProducts';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatNumber } from '@/utils/format';
import type { Product } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  filterInventoryAlerts,
  inventoryPriority,
  inventoryPriorityTint,
} from './inventoryHelpers';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type ChipTint = 'danger' | 'warning' | 'info';

function Chip({
  icon,
  tint,
  size = 40,
}: {
  icon: IoniconName;
  tint: ChipTint;
  size?: number;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const map: Record<ChipTint, { bg: string; fg: string }> = {
    danger: { bg: tokens.color.dangerSoft, fg: tokens.color.danger },
    warning: { bg: tokens.color.warningSoft, fg: tokens.color.warning },
    info: { bg: tokens.color.infoSoft, fg: tokens.color.info },
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: tokens.radius.pill,
        backgroundColor: map[tint].bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color={map[tint].fg} />
    </View>
  );
}

function Row({
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

function SummaryCell({
  labelKey,
  count,
  tint,
}: {
  labelKey: StringKey;
  count: number;
  tint: ChipTint;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 160,
        minWidth: 140,
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: tokens.spacing.sm,
      }}
    >
      <Chip icon="cube-outline" tint={tint} />
      <View>
        <Text variant="caption" tone="muted">
          {t(labelKey)}
        </Text>
        <Text variant="heading">{formatNumber(count)}</Text>
      </View>
    </View>
  );
}

export function InventoryScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const activeSite = useActiveSite();
  const productsQuery = useProducts();

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('inventory.noSite.title')}
          body={t('inventory.noSite.body')}
          icon="storefront-outline"
          action={{ label: t('site.connectCta'), onPress: () => go('/connect-site') }}
        />
      </Screen>
    );
  }

  const items = productsQuery.data?.items ?? [];
  const alerts = filterInventoryAlerts(items);
  const outOfStock = items.filter((p) => p.stockStatus === 'outofstock').length;
  const backorder = items.filter((p) => p.stockStatus === 'onbackorder').length;
  const lowStock = alerts.length - outOfStock - backorder;

  return (
    <Screen testID="inventory-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('inventory.title')}</Text>
        <Text tone="muted">{t('inventory.subtitle')}</Text>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.lg }}>
          <SummaryCell labelKey="inventory.summary.outOfStock" count={outOfStock} tint="danger" />
          <SummaryCell labelKey="inventory.summary.backorder" count={backorder} tint="warning" />
          <SummaryCell
            labelKey="inventory.summary.lowStock"
            count={Math.max(0, lowStock)}
            tint="warning"
          />
        </View>
      </Card>

      {productsQuery.isPending ? (
        <LoadingState label={t('common.loading')} />
      ) : productsQuery.isError ? (
        <ErrorState
          title={t('inventory.error')}
          retryLabel={t('common.retry')}
          onRetry={() => productsQuery.refetch()}
        />
      ) : alerts.length === 0 ? (
        <EmptyState title={t('inventory.empty')} icon="checkmark-circle-outline" fill={false} />
      ) : (
        <Card title={t('inventory.restockNeeded')}>
          {alerts.map((product: Product, index) => {
            const stock = stockBadge(product);
            const priority = inventoryPriority(product);
            return (
              <View key={product.id}>
                {index > 0 ? <Divider /> : null}
                <Row onPress={() => go(`/products/${product.id}`)}>
                  <Chip
                    icon={priority === 'critical' ? 'alert-circle-outline' : 'cube-outline'}
                    tint={inventoryPriorityTint(priority)}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="label" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {product.sku}
                      {product.brand ? ` · ${product.brand.name}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Badge tone={stock.tone} label={t(stock.labelKey)} />
                    {typeof product.stockQuantity === 'number' ? (
                      <Text variant="caption" tone="muted">
                        {formatNumber(product.stockQuantity)} {t('inventory.inStockQty')}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
                </Row>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
