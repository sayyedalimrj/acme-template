/**
 * Product list screen (mobile-first) with server-side pagination and stable scroll.
 */
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ListPaginationFooter } from '@/components/ui/ListPaginationFooter';
import { ProductImage } from '@/components/ui/ProductImage';
import { Text } from '@/components/ui';
import {
  AnimatedSection,
  EmptySiteCard,
  FilterChipRow,
  MobileListPage,
  MobileSearchField,
  MobileTabHeader,
  PressableScale,
  StatusBadge,
  type StatusTone,
} from '@/features/mobile/components';
import {
  mobileMetrics,
  mobileType,
  useMobileColors,
  useMobileShadow,
} from '@/features/mobile/mobileTokens';
import { useInfinitePagedQuery } from '@/hooks/useInfinitePagedQuery';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { isApiConfigured } from '@/config/api.config';
import { categoryService, productService, queryKeys } from '@/services';
import { useTheme } from '@/theme';
import type { BadgeTone } from '@/components/ui';
import type { Product, StockStatus } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  filterProducts,
  productTypeLabelKey,
  stockBadge,
  syncSourceLabelKey,
  type StockFilter,
} from './productHelpers';

const PAGE_SIZE = 20;

function toStatusTone(tone: BadgeTone): StatusTone {
  if (tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'info') {
    return tone;
  }
  return 'neutral';
}

const STOCK_FILTERS: readonly { value: StockFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'products.filter.allStock' },
  { value: 'instock', labelKey: 'products.filter.inStock' },
  { value: 'low', labelKey: 'products.filter.lowStock' },
  { value: 'outofstock', labelKey: 'products.filter.outOfStock' },
];

function stockToApi(stock: StockFilter): StockStatus | undefined {
  if (stock === 'instock') return 'instock';
  if (stock === 'outofstock') return 'outofstock';
  return undefined;
}

function ScreenTitle({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
}): React.JSX.Element {
  const colors = useMobileColors();
  return (
    <MobileTabHeader
      title={title}
      trailing={
        onAdd ? (
          <PressableScale
            onPress={onAdd}
            accessibilityLabel={addLabel}
            testID="product-add"
            pressScale={0.92}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={24} color={colors.onPrimary} />
          </PressableScale>
        ) : undefined
      }
    />
  );
}

function ProductRow({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, isRTL } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const stock = stockBadge(product);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={product.name}
      pressScale={0.985}
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 12,
        minHeight: mobileMetrics.listRowHeight,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <ProductImage
        uri={product.images[0]?.src}
        alt={product.images[0]?.alt ?? product.name}
        width={46}
        height={46}
        fit="cover"
        borderRadius={13}
      />

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          style={{
            fontSize: mobileType.labelSize,
            fontWeight: '600',
            color: colors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge tone={toStatusTone(stock.tone)} label={t(stock.labelKey)} />
          {product.sku ? (
            <Text style={{ fontSize: mobileType.captionSize, color: colors.muted }} numberOfLines={1}>
              {product.sku}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: rowDirection, gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: mobileType.captionSize, color: colors.muted }}>
            {t(productTypeLabelKey(product.type))}
          </Text>
          {product.syncSource ? (
            <Text style={{ fontSize: mobileType.captionSize, color: colors.muted }}>
              · {t(syncSourceLabelKey(product.syncSource))}
            </Text>
          ) : null}
          {typeof product.variationsCount === 'number' && product.variationsCount > 0 ? (
            <Text style={{ fontSize: mobileType.captionSize, color: colors.muted }}>
              · {t('product.meta.variations', { count: String(product.variationsCount) })}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 2 }}>
        <Text style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}>
          {fmt.money(product.price, product.currency)}
        </Text>
        {product.salePrice ? (
          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: colors.muted,
              textDecorationLine: 'line-through',
            }}
          >
            {fmt.money(product.regularPrice, product.currency)}
          </Text>
        ) : null}
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.mutedSoft} />
    </PressableScale>
  );
}

export function ProductListScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();
  const activeSite = useActiveSite();
  const siteId = activeSite.data?.id;

  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<StockFilter>('all');
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const categoriesQuery = useQuery({
    queryKey: ['site', siteId, 'categories'],
    queryFn: () => categoryService.listCategories(siteId),
    enabled: isApiConfigured() && Boolean(siteId),
  });

  const listQuery = useInfinitePagedQuery({
    queryKey: [...queryKeys.products(siteId ?? 'none'), categoryId ?? 'all'],
    queryFn: (q) => productService.listProducts(q),
    query: {
      search: search.trim() || undefined,
      stockStatus: stockToApi(stock),
      categoryId,
    },
    pageSize: PAGE_SIZE,
    enabled: Boolean(siteId),
  });

  const filtered = useMemo(() => {
    if (stock === 'low') {
      return filterProducts(listQuery.items, { search: '', stock: 'low' });
    }
    return listQuery.items;
  }, [listQuery.items, stock]);

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <MobileListPage
        testID="product-list-screen"
        header={<ScreenTitle title={t('products.title')} />}
        data={[]}
        keyExtractor={() => 'empty'}
        renderItem={() => null}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: mobileMetrics.screenPadding }}>
            <EmptySiteCard
              onPrimary={() => router.navigate('/onboarding' as never)}
              onSecondary={() => router.navigate('/connect-site' as never)}
            />
          </View>
        }
      />
    );
  }

  const listHeader = (
    <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16, paddingBottom: 8 }}>
      <AnimatedSection index={0}>
        <View style={{ gap: 12 }}>
          <MobileSearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t('products.searchPlaceholder')}
            testID="product-search"
          />
          <FilterChipRow
            options={STOCK_FILTERS.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
            value={stock}
            onChange={setStock}
          />
          {(categoriesQuery.data ?? []).length > 0 ? (
            <FilterChipRow
              options={[
                { value: 'all', label: t('products.filter.allCategories') },
                ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={categoryId ?? 'all'}
              onChange={(v) => setCategoryId(v === 'all' ? undefined : v)}
            />
          ) : null}
        </View>
      </AnimatedSection>
    </View>
  );

  const listFooter = (
    <View style={{ paddingHorizontal: mobileMetrics.screenPadding }}>
      {listQuery.isError ? (
        <PressableScale
          onPress={listQuery.refetch}
          accessibilityLabel={t('common.retry')}
          style={{ paddingVertical: 24, alignItems: 'center' }}
        >
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            {t('products.error')} · {t('common.retry')}
          </Text>
        </PressableScale>
      ) : (
        <ListPaginationFooter
          mode="infinite"
          page={listQuery.page}
          pageSize={PAGE_SIZE}
          total={listQuery.total}
          loading={listQuery.isFetchingNextPage}
          onLoadMore={listQuery.fetchNextPage}
        />
      )}
    </View>
  );

  return (
    <MobileListPage
      testID="product-list-screen"
      header={
        <ScreenTitle
          title={t('products.title')}
          onAdd={() => router.navigate('/products/new' as never)}
          addLabel={t('products.addNew')}
        />
      }
      data={filtered}
      keyExtractor={(p) => p.id}
      renderItem={({ item, index }) => (
        <View
          style={[
            {
              marginHorizontal: mobileMetrics.screenPadding,
              borderRadius: mobileMetrics.cardRadius,
              backgroundColor: colors.card,
            },
            index === 0 ? shadow : null,
          ]}
        >
          {index > 0 ? (
            <View style={{ height: 1, backgroundColor: colors.separator, marginHorizontal: 16 }} />
          ) : null}
          <ProductRow product={item} onPress={() => router.navigate(`/products/${item.id}` as never)} />
        </View>
      )}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={
        listQuery.isPending ? (
          <Text
            style={{
              color: colors.muted,
              textAlign: isRTL ? 'right' : 'left',
              paddingHorizontal: mobileMetrics.screenPadding,
            }}
          >
            {t('common.loading')}
          </Text>
        ) : (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={34} color={colors.mutedSoft} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>{t('products.empty')}</Text>
          </View>
        )
      }
    />
  );
}
