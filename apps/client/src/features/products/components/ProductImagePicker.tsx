/**
 * ProductImagePicker — mock product image selection (cross-platform, no real upload).
 *
 * Shows a large preview of the selected image and a row of selectable sample swatches. Because
 * the mock catalog uses placeholder image hosts that don't resolve, samples are rendered as
 * tinted tiles with an image glyph (so nothing appears broken) — they stand in for the real
 * photo-upload/gallery that arrives once the store backend is connected. RN-only, RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { MOBILE_FONT_FAMILY } from '@/features/mobile/mobileUxSpec';
import { mobileColors, mobileMetrics, mobileShadow, mobileType } from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';
import { PressableScale } from '@/features/mobile/components';

/** A selectable sample "image" (tinted placeholder — no real asset). */
export interface ProductImageSample {
  id: string;
  /** Tile tint. */
  color: string;
  /** Glyph shown on the tile. */
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export const PRODUCT_IMAGE_SAMPLES: readonly ProductImageSample[] = [
  { id: 'img_sample_1', color: '#456EFE', icon: 'shirt-outline' },
  { id: 'img_sample_2', color: '#2BA770', icon: 'cafe-outline' },
  { id: 'img_sample_3', color: '#D9971B', icon: 'bulb-outline' },
  { id: 'img_sample_4', color: '#E5575B', icon: 'bag-handle-outline' },
  { id: 'img_sample_5', color: '#7C5CFC', icon: 'cube-outline' },
  { id: 'img_sample_6', color: '#0EA5B7', icon: 'gift-outline' },
];

export interface ProductImagePickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProductImagePicker({
  selectedId,
  onSelect,
}: ProductImagePickerProps): React.JSX.Element {
  const t = useT();
  const { isRTL } = useTheme();
  const selected = PRODUCT_IMAGE_SAMPLES.find((s) => s.id === selectedId) ?? null;

  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontSize: mobileType.captionSize,
          color: mobileColors.textSecondary,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {t('product.new.mediaHint')}
      </Text>

      {/* Large preview of the selected image (or empty state). */}
      <View
        testID="product-image-preview"
        style={{
          height: 150,
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: selected ? selected.color : mobileColors.tile,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: selected ? 0 : 1.5,
          borderColor: mobileColors.separator,
          ...(selected ? mobileShadow : null),
        }}
      >
        <Ionicons
          name={selected ? selected.icon : 'image-outline'}
          size={40}
          color={selected ? mobileColors.onPrimary : mobileColors.mutedSoft}
        />
        <Text
          style={{
            fontSize: mobileType.captionSize,
            fontFamily: MOBILE_FONT_FAMILY,
            color: selected ? mobileColors.onPrimary : mobileColors.textSecondary,
          }}
        >
          {selected ? t('product.new.mediaSelected') : t('product.new.mediaNone')}
        </Text>
      </View>

      {/* Selectable samples. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          paddingVertical: 2,
        }}
      >
        {PRODUCT_IMAGE_SAMPLES.map((sample, index) => {
          const active = sample.id === selectedId;
          return (
            <PressableScale
              key={sample.id}
              testID={`product-image-sample-${index}`}
              accessibilityLabel={`${t('product.new.mediaSample')} ${index + 1}`}
              onPress={() => onSelect(sample.id)}
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                backgroundColor: sample.color,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: active ? 3 : 0,
                borderColor: mobileColors.text,
                opacity: active ? 1 : 0.85,
              }}
            >
              <Ionicons name={sample.icon} size={26} color={mobileColors.onPrimary} />
              {active ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    end: 4,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: mobileColors.onPrimary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={12} color={sample.color} />
                </View>
              ) : null}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}
