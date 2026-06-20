/**
 * Product detail screen.
 *
 * Read-only view of a single product organized into commerce-style sections (pricing,
 * inventory, organization, performance). The header exposes a working "ویرایش" (edit) action
 * that opens the edit screen (`/products/edit/[id]`), which writes name/price/stock/status to
 * WooCommerce (live) or the mock catalog and re-syncs. Active-site-aware via `useProduct`.
 *
 * Product image add/upload is intentionally not offered here yet — there is no safe media-upload
 * backend, so no broken upload control is rendered (image sync from WooCommerce IS shown below).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Image, Linking, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';

import { statusBadge, stockBadge } from './productHelpers';
import { useProduct } from './useProducts';

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

function DetailRow({ label, value }: DetailRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        paddingVertical: tokens.spacing.xs,
      }}
    >
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export interface ProductDetailScreenProps {
  productId: string;
}

export function ProductDetailScreen({ productId }: ProductDetailScreenProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();

  const activeSite = useActiveSite();
  const { data: product, isPending, isError, refetch } = useProduct(productId);

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

  if (isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen testID="product-detail-screen" title={t('product.notFound.title')}>
        <ErrorState
          title={t('product.notFound.title')}
          body={t('product.notFound.body')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  const stock = stockBadge(product);
  const status = statusBadge(product.status);
  const none = t('product.value.none');

  return (
    <Screen
      testID="product-detail-screen"
      title={product.name}
      subtitle={product.sku}
      headerRight={
        <View testID="product-edit">
          <IconButton
            icon="create-outline"
            accessibilityLabel={t('product.action.edit')}
            onPress={() => router.navigate(`/products/edit/${product.id}` as never)}
          />
        </View>
      }
    >
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
        <Badge tone={stock.tone} label={t(stock.labelKey)} />
        <Badge tone={status.tone} label={t(status.labelKey)} />
      </View>

      {product.adminEditUrl || product.permalink ? (
        <View style={{ alignItems: 'flex-start', marginTop: tokens.spacing.xs }}>
          <Button
            testID="product-open-wordpress"
            label={t('product.action.openInWordPress')}
            variant="secondary"
            size="sm"
            onPress={() => {
              const url = product.adminEditUrl ?? product.permalink;
              if (url) void Linking.openURL(url).catch(() => undefined);
            }}
            leading={<Ionicons name="open-outline" size={16} color={tokens.color.text} />}
          />
        </View>
      ) : null}

      <Card title={t('product.section.pricing')}>
        <DetailRow
          label={t('product.label.price')}
          value={fmt.money(product.price, product.currency)}
        />
        <DetailRow
          label={t('product.label.regularPrice')}
          value={fmt.money(product.regularPrice, product.currency)}
        />
        <DetailRow
          label={t('product.label.salePrice')}
          value={product.salePrice ? fmt.money(product.salePrice, product.currency) : none}
        />
      </Card>

      <Card title={t('product.section.inventory')}>
        <DetailRow
          label={t('product.label.stockStatus')}
          value={<Badge tone={stock.tone} label={t(stock.labelKey)} />}
        />
        <DetailRow
          label={t('product.label.stockQty')}
          value={
            typeof product.stockQuantity === 'number' ? fmt.num(product.stockQuantity) : none
          }
        />
      </Card>

      <Card title={t('product.section.organization')}>
        <DetailRow label={t('product.label.type')} value={product.type} />
        <DetailRow
          label={t('product.label.category')}
          value={product.categories.map((c) => c.name).join(', ') || none}
        />
        <DetailRow label={t('product.label.brand')} value={product.brand?.name ?? none} />
      </Card>

      <Card title={t('product.section.performance')}>
        <DetailRow
          label={t('product.label.unitsSold')}
          value={typeof product.totalSales === 'number' ? fmt.num(product.totalSales) : none}
        />
      </Card>

      <Card title={t('product.section.variants')}>
        <Text tone="muted">
          {product.type === 'variable'
            ? t('product.variants.variable')
            : t('product.variants.simple')}
        </Text>
      </Card>

      <Card title={t('product.section.media')}>
        {product.images.length > 0 ? (
          <Image
            testID="product-detail-image"
            source={{ uri: product.images[0].src }}
            accessibilityLabel={product.images[0].alt || product.name}
            resizeMode="cover"
            style={{
              width: '100%',
              height: 180,
              borderRadius: tokens.radius.md,
              backgroundColor: tokens.color.surfaceAlt,
            }}
          />
        ) : (
          <Text tone="muted">{t('product.media.placeholder')}</Text>
        )}
        <View style={{ marginTop: tokens.spacing.sm, alignItems: 'flex-start' }}>
          <Button
            label={t('product.media.openStudio')}
            variant="secondary"
            size="sm"
            onPress={() => router.navigate(`/media-studio?productId=${product.id}` as never)}
            leading={<Ionicons name="color-palette-outline" size={16} color={tokens.color.text} />}
          />
        </View>
      </Card>
    </Screen>
  );
}
