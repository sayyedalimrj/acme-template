/**
 * Product list screen (mobile-first).
 *
 * Clean, calm catalog: a soft search field, a single low-density stock filter row, and tidy
 * product rows (thumbnail placeholder, name, meta, one stock chip, price, chevron). Long
 * English names truncate cleanly; Persian labels align RTL. Mock-only data via useProducts;
 * rows deep-link to product detail.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import {
  AnimatedSection,
  EmptySiteCard,
  FilterChipRow,
  MobilePage,
  MobileSearchField,
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
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { BadgeTone } from '@/components/ui';
import type { Product } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import { filterProducts, stockBadge, type StockFilter } from './productHelpers';
import { useProducts } from './useProducts';

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
  const { rowDirection, isRTL } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: mobileMetrics.screenPadding,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: mobileType.titleSize,
          fontWeight: '700',
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {title}
      </Text>
      {onAdd ? (
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
      ) : null}
    </View>
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
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          backgroundColor: colors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="cube-outline" size={20} color={colors.muted} />
      </View>

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
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <StatusBadge tone={toStatusTone(stock.tone)} label={t(stock.labelKey)} />
          <Text
            style={{ fontSize: mobileType.captionSize, color: colors.muted }}
            numberOfLines={1}
          >
            {product.sku}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 2 }}>
        <Text
          style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}
        >
          {fmt.money(product.price, product.currency)}
        </Text>
      </View>
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.mutedSoft}
      />
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
  const productsQuery = useProducts();

  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<StockFilter>('all');

  const items = productsQuery.data?.items;
  const filtered = useMemo(
    () => filterProducts(items ?? [], { search, stock }),
    [items, search, stock],
  );

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <MobilePage testID="product-list-screen" header={<ScreenTitle title={t('products.title')} />}>
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
    <MobilePage
      testID="product-list-screen"
      header={
        <ScreenTitle
          title={t('products.title')}
          onAdd={() => router.navigate('/products/new' as never)}
          addLabel={t('products.addNew')}
        />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16 }}>
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
          </View>
        </AnimatedSection>

        {productsQuery.isPending ? (
          <Text style={{ color: colors.muted, textAlign: isRTL ? 'right' : 'left' }}>
            {t('common.loading')}
          </Text>
        ) : productsQuery.isError ? (
          <PressableScale
            onPress={() => productsQuery.refetch()}
            accessibilityLabel={t('common.retry')}
            style={{ paddingVertical: 24, alignItems: 'center' }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {t('products.error')} · {t('common.retry')}
            </Text>
          </PressableScale>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={34} color={colors.mutedSoft} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>{t('products.empty')}</Text>
          </View>
        ) : (
          <AnimatedSection index={1}>
            <View
              testID="product-list"
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
              {filtered.map((product, index) => (
                <View key={product.id}>
                  {index > 0 ? (
                    <View style={{ height: 1, backgroundColor: colors.separator }} />
                  ) : null}
                  <ProductRow
                    product={product}
                    onPress={() => router.navigate(`/products/${product.id}` as never)}
                  />
                </View>
              ))}
            </View>
          </AnimatedSection>
        )}
      </View>
    </MobilePage>
  );
}
