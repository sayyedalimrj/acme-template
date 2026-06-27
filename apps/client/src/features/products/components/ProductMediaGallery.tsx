/**
 * ProductMediaGallery — manage a WooCommerce product's FULL image gallery from inside the app.
 *
 * Shows every image (not just the cover). When a real backend is configured the merchant can:
 *   - upload a new image (web file picker → base64 → backend → store media library),
 *   - add an image by URL (Woo sideloads it),
 *   - remove an image, set the cover, and reorder.
 * Each action shows loading/error state and never silently drops a change. There is NO "edit in
 * WordPress" messaging. In the mock/demo build (no API) it renders the images read-only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Image, View } from 'react-native';

import { Button, Card, Input, Text } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import {
  getProductMedia,
  setProductMedia,
  toMediaRefs,
  uploadMedia,
  type ProductMediaImage,
} from '@/services/mediaApi';

interface PickedImage {
  filename: string;
  contentType: string;
  dataBase64: string;
}

/** Web-only file picker → base64 (guarded; returns null on native or cancel). */
async function pickWebImage(): Promise<PickedImage | null> {
  const g = globalThis as unknown as {
    document?: { createElement: (t: string) => Record<string, unknown> };
    FileReader?: new () => Record<string, unknown>;
  };
  if (!g.document || !g.FileReader) return null;
  return new Promise<PickedImage | null>((resolve) => {
    const input = g.document!.createElement('input') as Record<string, unknown> & {
      click: () => void;
      files?: { name?: string; type?: string }[];
    };
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new g.FileReader!() as Record<string, unknown> & {
        result?: string;
        readAsDataURL: (f: unknown) => void;
      };
      reader.onload = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve({
          filename: file.name || 'upload.jpg',
          contentType: file.type || 'image/jpeg',
          dataBase64: comma >= 0 ? result.slice(comma + 1) : result,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export interface ProductMediaGalleryProps {
  productId: string;
  /** Active site id (required for live management; absent in the mock build). */
  siteId?: string;
  /** Images already known from the product (used read-only when no API is configured). */
  fallbackImages?: readonly { src: string; alt?: string | null }[];
  /** When false, render the gallery read-only (no add/remove/cover controls). */
  editable?: boolean;
}

export function ProductMediaGallery({
  productId,
  siteId,
  fallbackImages = [],
  editable = true,
}: ProductMediaGalleryProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const live = isApiConfigured() && Boolean(siteId);

  if (!live) {
    // Mock/demo build: show every known image read-only (no broken management controls).
    return (
      <Card title={t('product.media.title')}>
        {fallbackImages.length === 0 ? (
          <Text variant="caption" tone="muted">
            {t('product.media.empty')}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
            {fallbackImages.map((img, i) => (
              <Image
                key={`${img.src}-${i}`}
                source={{ uri: img.src }}
                accessibilityIgnoresInvertColors
                style={{
                  width: 96,
                  height: 96,
                  aspectRatio: 1,
                  borderRadius: tokens.radius.md,
                  backgroundColor: tokens.color.surfaceAlt,
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </Card>
    );
  }

  return <LiveGallery productId={productId} siteId={siteId as string} editable={editable} />;
}

function LiveGallery({
  productId,
  siteId,
  editable,
}: {
  productId: string;
  siteId: string;
  editable: boolean;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const mediaQuery = useQuery({
    queryKey: ['site', siteId, 'product', productId, 'media'],
    queryFn: () => getProductMedia(siteId, productId),
  });
  const images: ProductMediaImage[] = mediaQuery.data?.images ?? [];

  const refreshAfterWrite = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'product', productId, 'media'] });
    await queryClient.invalidateQueries({ queryKey: ['site', siteId, 'products'] });
  };

  // Apply an ordered-array change (reorder/remove/cover/add) atomically through the backend.
  const apply = async (next: ProductMediaImage[]): Promise<void> => {
    setError(undefined);
    setBusy(true);
    try {
      await setProductMedia(siteId, productId, toMediaRefs(next));
      await refreshAfterWrite();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('product.media.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = (i: number): Promise<void> => apply(images.filter((_, idx) => idx !== i));
  const setCover = (i: number): Promise<void> => {
    if (i === 0) return Promise.resolve();
    const next = [images[i], ...images.filter((_, idx) => idx !== i)];
    return apply(next);
  };
  const move = (i: number, dir: -1 | 1): Promise<void> => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return Promise.resolve();
    const next = images.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return apply(next);
  };
  const addByUrl = (): Promise<void> => {
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setError(t('product.media.urlInvalid'));
      return Promise.resolve();
    }
    setUrl('');
    return apply([...images, { id: null, src: trimmed, alt: null, position: images.length, isCover: false }]);
  };

  const upload = async (): Promise<void> => {
    setError(undefined);
    const picked = await pickWebImage();
    if (!picked) {
      setError(t('product.media.pickUnavailable'));
      return;
    }
    setBusy(true);
    try {
      const res = await uploadMedia(siteId, picked);
      await setProductMedia(siteId, productId, [
        ...toMediaRefs(images),
        { id: res.media.id },
      ]);
      await refreshAfterWrite();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('product.media.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t('product.media.title')}>
      {mediaQuery.isPending ? (
        <Text variant="caption" tone="muted">
          {t('common.loading')}
        </Text>
      ) : images.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t('product.media.empty')}
        </Text>
      ) : (
        <View style={{ gap: tokens.spacing.sm }}>
          {images.map((img, i) => (
            <View
              key={`${img.id ?? img.src}-${i}`}
              style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
            >
              <Image
                source={{ uri: img.src }}
                accessibilityIgnoresInvertColors
                style={{
                  width: 72,
                  height: 72,
                  aspectRatio: 1,
                  borderRadius: tokens.radius.md,
                  backgroundColor: tokens.color.surfaceAlt,
                }}
                resizeMode="cover"
              />
              <View style={{ flex: 1, gap: 4 }}>
                {img.isCover ? (
                  <Text variant="caption" tone="success">
                    {t('product.media.cover')}
                  </Text>
                ) : null}
                {editable ? (
                  <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
                    {!img.isCover ? (
                      <Button label={t('product.media.setCover')} variant="ghost" size="sm" onPress={() => setCover(i)} disabled={busy} />
                    ) : null}
                    <Button label={t('product.media.up')} variant="ghost" size="sm" onPress={() => move(i, -1)} disabled={busy || i === 0} />
                    <Button label={t('product.media.down')} variant="ghost" size="sm" onPress={() => move(i, 1)} disabled={busy || i === images.length - 1} />
                    <Button
                      testID={`media-remove-${i}`}
                      label={t('product.media.remove')}
                      variant="ghost"
                      size="sm"
                      onPress={() => remove(i)}
                      disabled={busy}
                      leading={<Ionicons name="trash-outline" size={14} color={tokens.color.danger} />}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {editable ? (
        <View style={{ gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }}>
          <View style={{ alignItems: 'flex-start' }}>
            <Button
              testID="media-upload"
              label={t('product.media.upload')}
              variant="secondary"
              size="sm"
              onPress={upload}
              loading={busy}
              leading={<Ionicons name="cloud-upload-outline" size={16} color={tokens.color.text} />}
            />
          </View>
          <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Input
                testID="media-url"
                value={url}
                onChangeText={setUrl}
                placeholder={t('product.media.urlPlaceholder')}
                autoCapitalize="none"
              />
            </View>
            <Button label={t('product.media.addUrl')} variant="secondary" size="sm" onPress={addByUrl} disabled={busy} />
          </View>
          {mediaQuery.isError ? (
            <Text variant="caption" tone="danger">
              {t('product.media.loadError')}
            </Text>
          ) : null}
          {error ? (
            <Text testID="media-error" variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
