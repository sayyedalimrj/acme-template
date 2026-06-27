/**
 * ProductGalleryModal — full-screen image gallery with thumbnails and prev/next.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { ProductImage as ProductImageType } from '@/domain/types';

import { ProductImage } from './ProductImage';

export interface ProductGalleryModalProps {
  visible: boolean;
  images: ProductImageType[];
  initialIndex?: number;
  productName?: string;
  onClose: () => void;
}

export function ProductGalleryModal({
  visible,
  images,
  initialIndex = 0,
  productName,
  onClose,
}: ProductGalleryModalProps): React.JSX.Element {
  const { tokens, rowDirection, isRTL } = useTheme();
  const t = useT();
  const { width } = useWindowDimensions();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      {visible ? (
        <GalleryContent
          key={initialIndex}
          images={images}
          initialIndex={initialIndex}
          productName={productName}
          onClose={onClose}
          tokens={tokens}
          rowDirection={rowDirection}
          isRTL={isRTL}
          t={t}
          width={width}
        />
      ) : null}
    </Modal>
  );
}

function GalleryContent({
  images,
  initialIndex,
  productName,
  onClose,
  tokens,
  rowDirection,
  isRTL,
  t,
  width,
}: {
  images: ProductImageType[];
  initialIndex: number;
  productName?: string;
  onClose: () => void;
  tokens: ReturnType<typeof useTheme>['tokens'];
  rowDirection: 'row' | 'row-reverse';
  isRTL: boolean;
  t: ReturnType<typeof useT>;
  width: number;
}): React.JSX.Element {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        paddingTop: tokens.spacing.xl,
        paddingHorizontal: tokens.spacing.md,
        paddingBottom: tokens.spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacing.md,
        }}
      >
        <Text variant="subheading" style={{ color: '#fff', flex: 1 }} numberOfLines={1}>
          {productName ?? t('product.gallery.title')}
        </Text>
        <IconButton
          icon="close"
          accessibilityLabel={t('common.cancel')}
          onPress={onClose}
          tone="muted"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: tokens.spacing.md }}>
        <ProductImage
          uri={current?.src}
          alt={current?.alt}
          width="100%"
          height={Math.min(width * 0.75, 420)}
          fit="contain"
          testID="gallery-main-image"
        />

        {images.length > 1 ? (
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing.lg,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('product.gallery.prev')}
              disabled={!hasPrev}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              style={{ opacity: hasPrev ? 1 : 0.35, padding: 8 }}
            >
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={28}
                color="#fff"
              />
            </Pressable>
            <Text variant="caption" style={{ color: '#fff' }}>
              {t('product.gallery.counter', {
                current: String(index + 1),
                total: String(images.length),
              })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('product.gallery.next')}
              disabled={!hasNext}
              onPress={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
              style={{ opacity: hasNext ? 1 : 0.35, padding: 8 }}
            >
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={28}
                color="#fff"
              />
            </Pressable>
          </View>
        ) : null}

        {current?.alt ? (
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
            {current.alt}
          </Text>
        ) : null}
      </View>

      {images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: rowDirection,
            gap: tokens.spacing.sm,
            paddingTop: tokens.spacing.md,
          }}
        >
          {images.map((img, i) => (
            <Pressable key={img.id || `${img.src}-${i}`} onPress={() => setIndex(i)}>
              <ProductImage
                uri={img.src}
                alt={img.alt}
                width={64}
                height={64}
                fit="cover"
                borderRadius={8}
                style={{
                  borderWidth: i === index ? 2 : 0,
                  borderColor: tokens.color.primary,
                }}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
