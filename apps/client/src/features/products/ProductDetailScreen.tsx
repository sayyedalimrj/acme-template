/**
 * Product detail screen — rich synced product overview with gallery and sync metadata.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  ProductGalleryModal,
  ProductImage,
  Screen,
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';

import {
  productTypeLabelKey,
  statusBadge,
  stockBadge,
  syncSourceLabelKey,
  syncStatusBadge,
} from './productHelpers';
import { useDeleteProduct, useProduct } from './useProducts';

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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const activeSite = useActiveSite();
  const { data: product, isPending, isError, refetch } = useProduct(productId);
  const del = useDeleteProduct(productId);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | undefined>();

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
  const syncStatus = product.syncStatus ? syncStatusBadge(product.syncStatus) : null;
  const none = t('product.value.none');

  const openGallery = (index: number): void => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

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
        <Badge tone="neutral" label={t(productTypeLabelKey(product.type))} />
        {syncStatus ? <Badge tone={syncStatus.tone} label={t(syncStatus.labelKey)} /> : null}
        {product.syncSource ? (
          <Badge tone="info" label={t(syncSourceLabelKey(product.syncSource))} />
        ) : null}
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

      <Card title={t('product.section.overview')}>
        <DetailRow label={t('product.label.type')} value={t(productTypeLabelKey(product.type))} />
        <DetailRow
          label={t('product.label.lastUpdated')}
          value={fmt.date(product.dateModified)}
        />
        {product.lastSyncedAt ? (
          <DetailRow
            label={t('product.label.lastSync')}
            value={fmt.date(product.lastSyncedAt)}
          />
        ) : null}
        {typeof product.averageRating === 'number' ? (
          <DetailRow
            label={t('product.label.rating')}
            value={`${fmt.num(product.averageRating)} (${fmt.num(product.ratingCount ?? 0)})`}
          />
        ) : null}
      </Card>

      <Card title={t('product.section.pricing')}>
        <DetailRow label={t('product.label.currentPrice')} value={fmt.money(product.price, product.currency)} />
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
          value={typeof product.stockQuantity === 'number' ? fmt.num(product.stockQuantity) : none}
        />
        {typeof product.variationsCount === 'number' ? (
          <DetailRow
            label={t('product.label.variationsCount')}
            value={fmt.num(product.variationsCount)}
          />
        ) : null}
      </Card>

      <Card title={t('product.section.organization')}>
        <DetailRow
          label={t('product.label.category')}
          value={product.categories.map((c) => c.name).join('، ') || none}
        />
        <DetailRow
          label={t('product.label.tags')}
          value={product.tags?.map((tg) => tg.name).join('، ') || none}
        />
        <DetailRow label={t('product.label.brand')} value={product.brand?.name ?? none} />
      </Card>

      {product.attributes && product.attributes.length > 0 ? (
        <Card title={t('product.section.attributes')}>
          {product.attributes.map((attr) => (
            <DetailRow
              key={attr.id}
              label={attr.name}
              value={attr.options.join('، ') || none}
            />
          ))}
        </Card>
      ) : null}

      {product.variations && product.variations.length > 0 ? (
        <Card title={t('product.section.variations')}>
          {product.variations.slice(0, 8).map((v) => {
            const vStock = stockBadge({
              ...product,
              stockStatus: v.stockStatus,
              stockQuantity: v.stockQuantity,
            });
            return (
              <DetailRow
                key={v.id}
                label={v.sku || v.id}
                value={`${fmt.money(v.price, product.currency)} · ${t(vStock.labelKey)}`}
              />
            );
          })}
          {product.variations.length > 8 ? (
            <Text variant="caption" tone="muted">
              {t('product.variations.more', { count: String(product.variations.length - 8) })}
            </Text>
          ) : null}
        </Card>
      ) : (
        <Card title={t('product.section.variants')}>
          <Text tone="muted">
            {product.type === 'variable'
              ? t('product.variants.variable')
              : t('product.variants.simple')}
          </Text>
        </Card>
      )}

      <Card title={t('product.section.performance')}>
        <DetailRow
          label={t('product.label.unitsSold')}
          value={typeof product.totalSales === 'number' ? fmt.num(product.totalSales) : none}
        />
      </Card>

      <Card title={t('product.section.media')}>
        {product.images.length > 0 ? (
          <View style={{ gap: tokens.spacing.sm }}>
            <Pressable onPress={() => openGallery(0)} accessibilityRole="button">
              <ProductImage
                uri={product.images[0]?.src}
                alt={product.images[0]?.alt ?? product.name}
                width="100%"
                height={220}
                fit="contain"
                testID="product-detail-image"
              />
            </Pressable>
            {product.images.length > 1 ? (
              <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
                {product.images.map((img, i) => (
                  <Pressable key={img.id || `${img.src}-${i}`} onPress={() => openGallery(i)}>
                    <ProductImage uri={img.src} alt={img.alt} width={72} height={72} fit="cover" />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text variant="caption" tone="muted">
              {t('product.gallery.viewOnly')}
            </Text>
          </View>
        ) : (
          <Text tone="muted">{t('product.media.empty')}</Text>
        )}
        <View style={{ marginTop: tokens.spacing.sm, flexDirection: rowDirection, gap: tokens.spacing.sm }}>
          <Button
            testID="product-detail-edit-media"
            label={t('product.media.title')}
            variant="secondary"
            size="sm"
            onPress={() => router.navigate(`/products/edit/${product.id}` as never)}
            leading={<Ionicons name="images-outline" size={16} color={tokens.color.text} />}
          />
          <Button
            label={t('product.media.openStudio')}
            variant="secondary"
            size="sm"
            onPress={() => router.navigate(`/media-studio?productId=${product.id}` as never)}
            leading={<Ionicons name="color-palette-outline" size={16} color={tokens.color.text} />}
          />
        </View>
      </Card>

      <ProductGalleryModal
        visible={galleryOpen}
        images={product.images}
        initialIndex={galleryIndex}
        productName={product.name}
        onClose={() => setGalleryOpen(false)}
      />

      <Card title={t('product.delete.heading')}>
        {!confirmDelete ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Button
              testID="product-delete"
              label={t('product.delete.button')}
              variant="ghost"
              onPress={() => {
                setDeleteError(undefined);
                setConfirmDelete(true);
              }}
              leading={<Ionicons name="trash-outline" size={16} color={tokens.color.danger} />}
            />
          </View>
        ) : (
          <View style={{ gap: tokens.spacing.sm }}>
            <Text testID="product-delete-confirm" variant="caption" tone="danger">
              {t('product.delete.confirm')}
            </Text>
            <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm }}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                size="sm"
                onPress={() => setConfirmDelete(false)}
                disabled={del.isPending}
              />
              <Button
                testID="product-delete-confirm-btn"
                label={t('product.delete.confirmButton')}
                variant="ghost"
                size="sm"
                loading={del.isPending}
                onPress={() => {
                  setDeleteError(undefined);
                  del.mutate(undefined, {
                    onSuccess: () => router.back(),
                    onError: (e: unknown) =>
                      setDeleteError(e instanceof Error ? e.message : t('product.delete.error')),
                  });
                }}
              />
            </View>
            {deleteError ? (
              <Text testID="product-delete-error" variant="caption" tone="danger">
                {deleteError}
              </Text>
            ) : null}
          </View>
        )}
      </Card>
    </Screen>
  );
}
