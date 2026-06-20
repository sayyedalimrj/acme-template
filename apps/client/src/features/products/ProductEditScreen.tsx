/**
 * Product edit screen.
 *
 * A focused, working edit form for the controlled product fields the backend can safely write to
 * WooCommerce (name, price, stock quantity/status, publication status). It loads the current
 * product, submits via `useUpdateProduct` (live: PATCH → WooCommerce → read-model resync; mock:
 * in-memory), and returns to the detail screen on success. No image/binary upload here — there is
 * no safe upload backend yet (see the detail-screen note), so no broken upload control is shown.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { Product, ProductStatus, StockStatus } from '@/domain/types';

import { useProduct, useUpdateProduct } from './useProducts';

export interface ProductEditScreenProps {
  productId: string;
}

/** Loader: fetches the product, then mounts the form with seeded initial values (no effects). */
export function ProductEditScreen({ productId }: ProductEditScreenProps): React.JSX.Element {
  const t = useT();
  const { data: product, isPending, isError, refetch } = useProduct(productId);

  if (isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen testID="product-edit-screen" title={t('product.notFound.title')}>
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

  return <ProductEditForm productId={productId} product={product} />;
}

interface ProductEditFormProps {
  productId: string;
  product: Product;
}

function ProductEditForm({ productId, product }: ProductEditFormProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const router = useRouter();
  const activeSite = useActiveSite();
  const update = useUpdateProduct(productId);

  // Initial values seeded from the loaded product (lazy initializers — run once on mount).
  const [name, setName] = useState(() => product.name);
  const [price, setPrice] = useState(() => String(product.regularPrice ?? product.price ?? ''));
  const [stockQty, setStockQty] = useState(() =>
    product.stockQuantity !== undefined ? String(product.stockQuantity) : '',
  );
  const [stockStatus, setStockStatus] = useState<StockStatus>(() => product.stockStatus);
  const [status, setStatus] = useState<ProductStatus>(() =>
    product.status === 'publish' ? 'publish' : 'draft',
  );
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const onSave = (): void => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('product.edit.nameRequired'));
      return;
    }
    setNameError(undefined);
    const priceNum = Number(price);
    const qtyNum = stockQty.trim() === '' ? undefined : Number(stockQty);
    update.mutate(
      {
        name: trimmed,
        regularPrice: Number.isFinite(priceNum) && price.trim() !== '' ? priceNum : undefined,
        stockQuantity: qtyNum !== undefined && Number.isFinite(qtyNum) ? qtyNum : undefined,
        stockStatus,
        status,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen testID="product-edit-screen" title={t('product.edit.title')} subtitle={product.sku}>
      <Card title={t('product.section.pricing')}>
        <FormField label={t('product.edit.field.name')} required error={nameError}>
          <Input
            testID="product-edit-name"
            value={name}
            onChangeText={setName}
            editable={!update.isPending}
          />
        </FormField>
        <FormField label={t('product.edit.field.price')}>
          <Input
            testID="product-edit-price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            editable={!update.isPending}
          />
        </FormField>
      </Card>

      <Card title={t('product.section.inventory')}>
        <FormField label={t('product.edit.field.stockQty')}>
          <Input
            testID="product-edit-stock-qty"
            value={stockQty}
            onChangeText={setStockQty}
            keyboardType="numeric"
            editable={!update.isPending}
          />
        </FormField>
        <FormField label={t('product.edit.field.stockStatus')}>
          <SegmentedControl<StockStatus>
            value={stockStatus}
            onChange={setStockStatus}
            options={[
              { value: 'instock', label: t('product.stock.instock') },
              { value: 'outofstock', label: t('product.stock.outofstock') },
              { value: 'onbackorder', label: t('product.stock.onbackorder') },
            ]}
          />
        </FormField>
      </Card>

      <Card title={t('product.edit.field.status')}>
        <SegmentedControl<ProductStatus>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'publish', label: t('product.status.publish') },
            { value: 'draft', label: t('product.status.draft') },
          ]}
        />
      </Card>

      {update.isError ? (
        <Text tone="danger" variant="caption">
          {t('product.edit.error')}
        </Text>
      ) : null}

      <View style={{ marginTop: tokens.spacing.sm }}>
        <Button
          testID="product-edit-save"
          label={update.isPending ? t('product.edit.saving') : t('product.edit.cta')}
          onPress={onSave}
          disabled={update.isPending || activeSite.isPending}
        />
      </View>
    </Screen>
  );
}
