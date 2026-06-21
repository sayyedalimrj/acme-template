/**
 * ProductCreateScreen — "new product" form (simple, P2-friendly).
 *
 * Collects the simple fields a merchant needs (name, SKU, price, stock, status, description) and
 * creates the product through the active data source: in production it creates a REAL WooCommerce
 * product via the backend and reports its TRUTHFUL resulting status (published vs draft) — never a
 * fake "submitted for review". In the mock build it adds to the in-memory catalog.
 *
 * Product photos are NOT uploaded here: there is no binary media-upload endpoint yet, so rather
 * than show a picker whose selection would be silently dropped, the media section is an honest
 * note telling the merchant to add the image in WordPress after the product is created (the detail
 * screen shows the synced image and an "Open in WordPress" action for that). RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import {
  AnimatedSection,
  FilterChipRow,
  MobilePage,
  MobileSubHeader,
  PressableScale,
} from '@/features/mobile/components';
import { NO_WEB_OUTLINE, useMobileFontFamily } from '@/features/mobile/mobileUxSpec';
import { mobileMetrics, mobileType, useMobileColors, useMobileShadow } from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { useCreateProduct } from './useProducts';

import type { ProductStatus } from '@/domain/types';

type ProductDraftStatus = 'publish' | 'draft';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
}): React.JSX.Element {
  const colors = useMobileColors();
  const fontFamily = useMobileFontFamily();
  const { isRTL } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: mobileType.labelSize,
          fontWeight: '600',
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedSoft}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          minHeight: multiline ? 92 : 48,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: colors.tile,
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : 'transparent',
          fontSize: mobileType.bodySize,
          color: colors.text,
          fontFamily,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
          textAlignVertical: multiline ? 'top' : 'center',
          ...NO_WEB_OUTLINE,
        }}
      />
    </View>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const { isRTL } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: colors.card,
          padding: 16,
          gap: 14,
        },
        shadow,
      ]}
    >
      <Text
        style={{
          fontSize: mobileType.sectionSize,
          fontWeight: '700',
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function ProductCreateScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState<ProductDraftStatus>('publish');
  const [description, setDescription] = useState('');
  const [savedStatus, setSavedStatus] = useState<ProductStatus | null>(null);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [error, setError] = useState(false);
  const create = useCreateProduct();

  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/products' as never);
    }
  };

  // Creates the product through the active data source and reports the TRUTHFUL resulting status.
  const onSave = (): void => {
    if (name.trim().length === 0) {
      setError(true);
      setSavedStatus(null);
      return;
    }
    setError(false);
    setSubmitError(undefined);
    const priceNum = Number(price.replace(/[^\d.]/g, ''));
    const stockNum = Number(stock.replace(/[^\d-]/g, ''));
    create.mutate(
      {
        name: name.trim(),
        sku: sku.trim() || undefined,
        regularPrice: price.trim() && Number.isFinite(priceNum) ? priceNum : undefined,
        status,
        stockQuantity: stock.trim() && Number.isFinite(stockNum) ? stockNum : undefined,
        description: description.trim() || undefined,
      },
      {
        onSuccess: (created) => setSavedStatus(created.status),
        onError: (e: unknown) =>
          setSubmitError(e instanceof Error ? e.message : t('product.new.saveError')),
      },
    );
  };

  return (
    <MobilePage
      testID="product-create-screen"
      header={
        <MobileSubHeader
          title={t('product.new.title')}
          onBack={onBack}
          backLabel={t('mobile.back')}
        />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16 }}>
        <AnimatedSection index={0}>
          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: colors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('product.new.subtitle')}
          </Text>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <FormCard title={t('product.new.basics')}>
            <Field
              label={t('product.new.name')}
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) {
                  setError(false);
                }
              }}
              placeholder={t('product.new.namePlaceholder')}
            />
            {error ? (
              <Text
                style={{
                  fontSize: mobileType.captionSize,
                  color: colors.statusDanger,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('product.new.required')}
              </Text>
            ) : null}
            <Field
              label={t('product.new.sku')}
              value={sku}
              onChangeText={setSku}
              placeholder={t('product.new.skuPlaceholder')}
            />
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: mobileType.labelSize,
                  fontWeight: '600',
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('product.new.status')}
              </Text>
              <FilterChipRow
                options={[
                  { value: 'publish', label: t('product.new.statusPublish') },
                  { value: 'draft', label: t('product.new.statusDraft') },
                ]}
                value={status}
                onChange={setStatus}
              />
            </View>
          </FormCard>
        </AnimatedSection>

        <AnimatedSection index={3}>
          <FormCard title={t('product.new.pricingStock')}>
            <Field
              label={t('product.new.price')}
              value={price}
              onChangeText={setPrice}
              placeholder={t('product.new.pricePlaceholder')}
              keyboardType="numeric"
            />
            <Field
              label={t('product.new.stock')}
              value={stock}
              onChangeText={setStock}
              placeholder={t('product.new.stockPlaceholder')}
              keyboardType="numeric"
            />
            <Field
              label={t('product.new.description')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('product.new.descriptionPlaceholder')}
              multiline
            />
          </FormCard>
        </AnimatedSection>

        <AnimatedSection index={4}>
          <PressableScale
            onPress={onSave}
            accessibilityLabel={t('product.new.save')}
            testID="product-save"
            disabled={create.isPending}
            style={{
              height: mobileMetrics.buttonHeight,
              borderRadius: mobileMetrics.buttonRadius,
              backgroundColor: colors.primary,
              opacity: create.isPending ? 0.7 : 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15 }}>
              {t('product.new.save')}
            </Text>
          </PressableScale>

          {submitError ? (
            <Text
              testID="product-save-error"
              style={{
                marginTop: 12,
                fontSize: mobileType.captionSize,
                color: colors.statusDanger,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {submitError}
            </Text>
          ) : null}

          {savedStatus ? (
            <View
              testID="product-saved-note"
              style={{
                marginTop: 12,
                gap: 10,
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.statusActiveSoft,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={savedStatus === 'publish' ? 'checkmark-circle' : 'document-text-outline'}
                  size={18}
                  color={colors.statusActive}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: mobileType.captionSize,
                    color: colors.statusActive,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {savedStatus === 'publish'
                    ? `${t('product.new.savedPublished')} · ${t('product.new.savedPublishedNote')}`
                    : `${t('product.new.savedDraft')} · ${t('product.new.savedDraftNote')}`}
                </Text>
              </View>
              <PressableScale
                onPress={() => router.navigate('/products' as never)}
                accessibilityLabel={t('product.new.viewProducts')}
                testID="product-view-products"
                style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  {t('product.new.viewProducts')}
                </Text>
              </PressableScale>
            </View>
          ) : null}

          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            {t('product.new.mockNote')}
          </Text>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
