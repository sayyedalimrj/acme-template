/**
 * ProductCreateScreen — mock "new product" form.
 *
 * Gives merchants a real structure to define a new product (name, SKU, price, stock, status,
 * description). MOCK-ONLY and FRONTEND-SAFE: saving is intentionally disabled — nothing is
 * written to a real store and no backend is called. On "save" we only show an in-memory demo
 * confirmation. Matches the mobile design language (MobilePage + mobile tokens). RTL-safe.
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
import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '@/features/mobile/mobileUxSpec';
import { mobileColors, mobileMetrics, mobileShadow, mobileType } from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

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
  const { isRTL } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: mobileType.labelSize,
          fontWeight: '600',
          color: mobileColors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mobileColors.mutedSoft}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          minHeight: multiline ? 92 : 48,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: mobileColors.tile,
          borderWidth: 1.5,
          borderColor: focused ? mobileColors.primary : 'transparent',
          fontSize: mobileType.bodySize,
          color: mobileColors.text,
          fontFamily: MOBILE_FONT_FAMILY,
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
  const { isRTL } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: mobileColors.card,
          padding: 16,
          gap: 14,
        },
        mobileShadow,
      ]}
    >
      <Text
        style={{
          fontSize: mobileType.sectionSize,
          fontWeight: '700',
          color: mobileColors.text,
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
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState<ProductDraftStatus>('publish');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/products' as never);
    }
  };

  // Mock-only: validate locally and show a demo confirmation. Nothing is sent anywhere.
  const onSave = (): void => {
    if (name.trim().length === 0) {
      setError(true);
      setSaved(false);
      return;
    }
    setError(false);
    setSaved(true);
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
              color: mobileColors.textSecondary,
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
                  color: mobileColors.statusDanger,
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
                  color: mobileColors.text,
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

        <AnimatedSection index={2}>
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

        <AnimatedSection index={3}>
          <PressableScale
            onPress={onSave}
            accessibilityLabel={t('product.new.save')}
            testID="product-save"
            style={{
              height: mobileMetrics.buttonHeight,
              borderRadius: mobileMetrics.buttonRadius,
              backgroundColor: mobileColors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Ionicons name="checkmark" size={20} color={mobileColors.onPrimary} />
            <Text style={{ color: mobileColors.onPrimary, fontWeight: '700', fontSize: 15 }}>
              {t('product.new.save')}
            </Text>
          </PressableScale>

          {saved ? (
            <View
              testID="product-saved-note"
              style={{
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 12,
                backgroundColor: mobileColors.statusActiveSoft,
              }}
            >
              <Ionicons name="information-circle" size={18} color={mobileColors.statusActive} />
              <Text
                style={{
                  flex: 1,
                  fontSize: mobileType.captionSize,
                  color: mobileColors.statusActive,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('product.new.saved')} · {t('product.new.savedNote')}
              </Text>
            </View>
          ) : null}

          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: mobileColors.textSecondary,
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
