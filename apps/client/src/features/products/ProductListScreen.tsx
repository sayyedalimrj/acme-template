/**
 * Product list screen.
 *
 * Active-site-aware catalog browser: search (name/SKU) + stock/status filters over the
 * mocked product list, with loading/empty/error states. Rows navigate to product detail.
 * Filtering runs client-side on the fetched list for snappy UX; `useProducts` also accepts
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
  SegmentedControl,
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { Product } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  filterProducts,
  statusBadge,
  stockBadge,
  type StatusFilter,
  type StockFilter,
} from './productHelpers';
import { useProducts } from './useProducts';

interface ProductRowProps {
  product: Product;
  onPress: () => void;
}

function ProductRow({ product, onPress }: ProductRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const stock = stockBadge(product);
  const status = statusBadge(product.status);
  const hasSale = Boolean(product.salePrice);
  const isDraft = product.status !== 'publish';

  const rowStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.md,
    minHeight: 64,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.borderWidth.hairline,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      {/* Thumbnail placeholder — uses the left space and gives the row visual structure. */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: tokens.radius.md,
          backgroundColor: tokens.color.surfaceAlt,
          borderWidth: tokens.borderWidth.hairline,
          borderColor: tokens.color.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="cube-outline" size={20} color={tokens.color.textMuted} />
      </View>

      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <Text variant="label" numberOfLines={1} style={{ fontWeight: '600' }}>
          {product.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {product.sku}
          {product.brand ? ` · ${product.brand.name}` : ''}
          {product.categories[0] ? ` · ${product.categories[0].name}` : ''}
        </Text>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Badge tone={stock.tone} label={t(stock.labelKey)} />
          {isDraft ? <Badge tone={status.tone} label={t(status.labelKey)} /> : null}
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text variant="label" style={{ fontWeight: '700' }}>
          {fmt.money(product.price, product.currency)}
        </Text>
        {hasSale ? (
          <Text variant="caption" tone="muted" style={{ textDecorationLine: 'line-through' }}>
            {fmt.money(product.regularPrice, product.currency)}
          </Text>
        ) : typeof product.stockQuantity === 'number' ? (
          <Text variant="caption" tone="muted">
            {fmt.num(product.stockQuantity)} {t('inventory.inStockQty')}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
    </Pressable>
  );
}

const STOCK_FILTERS: { value: StockFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'products.filter.allStock' },
  { value: 'instock', labelKey: 'products.filter.inStock' },
  { value: 'low', labelKey: 'products.filter.lowStock' },
  { value: 'outofstock', labelKey: 'products.filter.outOfStock' },
];

const STATUS_FILTERS: { value: StatusFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'products.filter.allStatus' },
  { value: 'publish', labelKey: 'products.filter.published' },
  { value: 'draft', labelKey: 'products.filter.draft' },
];

export function ProductListScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();

  const activeSite = useActiveSite();
  const productsQuery = useProducts();

  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<StockFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const items = productsQuery.data?.items;
  const filtered = useMemo(
    () => filterProducts(items ?? [], { search, stock, status }),
    [items, search, stock, status],
  );
  const total = items?.length ?? 0;

  // No active site → guide to Connect Site.
  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('products.noSite.title')}
          body={t('products.noSite.body')}
          icon="storefront-outline"
          action={{
            label: t('site.connectCta'),
            onPress: () => router.navigate('/connect-site' as never),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="product-list-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('products.title')}</Text>
        <Text tone="muted">{t('products.subtitle')}</Text>
      </View>

      <Card padding="md" contentStyle={{ gap: tokens.spacing.sm }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('products.searchPlaceholder')}
          autoCapitalize="none"
          testID="product-search"
        />
        <SegmentedControl
          options={STOCK_FILTERS.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
          value={stock}
          onChange={setStock}
        />
        <SegmentedControl
          options={STATUS_FILTERS.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
          value={status}
          onChange={setStatus}
          stretch
        />
      </Card>

      {productsQuery.isPending ? (
        <LoadingState label={t('common.loading')} />
      ) : productsQuery.isError ? (
        <ErrorState
          title={t('products.error')}
          retryLabel={t('common.retry')}
          onRetry={() => productsQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('products.empty')} icon="cube-outline" fill={false} />
      ) : (
        <View style={{ gap: tokens.spacing.xs }} testID="product-list">
          <Text variant="caption" tone="muted">
            {fmt.num(filtered.length)} / {fmt.num(total)}
          </Text>
          {filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onPress={() => router.navigate(`/products/${product.id}` as never)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
