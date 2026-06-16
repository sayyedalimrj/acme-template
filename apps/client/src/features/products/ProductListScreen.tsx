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
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils/format';
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

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: ChipProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        paddingVertical: tokens.spacing.xs + 2,
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.pill,
        borderWidth: tokens.borderWidth.thin,
        borderColor: active ? tokens.color.primary : tokens.color.border,
        backgroundColor: active ? tokens.color.primarySoft : tokens.color.surface,
      }}
    >
      <Text
        variant="caption"
        style={{ color: active ? tokens.color.primary : tokens.color.textMuted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface ProductRowProps {
  product: Product;
  onPress: () => void;
}

function ProductRow({ product, onPress }: ProductRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const stock = stockBadge(product);
  const status = statusBadge(product.status);
  const hasSale = Boolean(product.salePrice);

  const rowStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: tokens.spacing.md,
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
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subheading" numberOfLines={1}>
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
          <Badge tone={status.tone} label={t(status.labelKey)} />
          {typeof product.stockQuantity === 'number' ? (
            <Text variant="caption" tone="muted">
              {formatNumber(product.stockQuantity)} in stock
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text variant="label">{formatCurrency(product.price, product.currency)}</Text>
        {hasSale ? (
          <Text variant="caption" tone="muted" style={{ textDecorationLine: 'line-through' }}>
            {formatCurrency(product.regularPrice, product.currency)}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.color.textMuted} />
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
  const { tokens, rowDirection } = useTheme();
  const t = useT();
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

  const chipRow: ViewStyle = {
    flexDirection: rowDirection,
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  };

  return (
    <Screen testID="product-list-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('products.title')}</Text>
        <Text tone="muted">{t('products.subtitle')}</Text>
      </View>

      <Card>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('products.searchPlaceholder')}
          autoCapitalize="none"
          testID="product-search"
        />
        <View style={chipRow}>
          {STOCK_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={t(f.labelKey)}
              active={stock === f.value}
              onPress={() => setStock(f.value)}
            />
          ))}
        </View>
        <View style={chipRow}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={t(f.labelKey)}
              active={status === f.value}
              onPress={() => setStatus(f.value)}
            />
          ))}
        </View>
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
        <View style={{ gap: tokens.spacing.sm }} testID="product-list">
          <Text variant="caption" tone="muted">
            {formatNumber(filtered.length)} / {formatNumber(total)}
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
