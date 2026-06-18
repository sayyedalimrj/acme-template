/**
 * AI Product Media Studio (index) — mock product-media workflow.
 *
 * Select a product, analyze a SIMULATED source image, choose a task, generate MOCK output
 * variants, and browse promo-video concepts. Everything is review-only.
 *
 * SECURITY: MOCK-ONLY. No real AI/image/video provider, no external API, no file upload, no
 * product image sent anywhere, nothing published or applied to products (see security-model.md).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, EmptyState, LoadingState, Screen, Text } from '@/components/ui';
import { ChoiceGroup } from '@/features/onboarding/components/ChoiceGroup';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { products } from '@/mock/data/catalog';
import { useTheme } from '@/theme';
import type {
  MediaStudioAsset,
  MediaStudioSourcePreset,
  MediaStudioTaskType,
} from '@/domain/types';

import { OutputVariantCard } from './components/OutputVariantCard';
import { SourceQualityPanel } from './components/SourceQualityPanel';
import { TaskChooser } from './components/TaskChooser';
import { VideoConceptCard } from './components/VideoConceptCard';
import { taskLabelKey } from './mediaStudioHelpers';
import { useMediaStudioInfo, useMediaStudioVariants } from './useMediaStudio';
import {
  useAnalyzeSourceAsset,
  useApproveVariant,
  useCreateGeneration,
  useDismissVariant,
  useMarkVariantReviewed,
} from './useMediaStudioMutations';

export interface MediaStudioScreenProps {
  initialProductId?: string;
}

export function MediaStudioScreen({ initialProductId }: MediaStudioScreenProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();

  const defaultProductId =
    initialProductId && products.some((p) => p.id === initialProductId)
      ? initialProductId
      : (products[0]?.id ?? '');

  const [productId, setProductId] = useState<string>(defaultProductId);
  const [preset, setPreset] = useState<MediaStudioSourcePreset>('blurry');
  const [asset, setAsset] = useState<MediaStudioAsset | null>(null);
  const [task, setTask] = useState<MediaStudioTaskType | null>(null);

  const infoQuery = useMediaStudioInfo();
  const variantsQuery = useMediaStudioVariants(productId);
  const analyze = useAnalyzeSourceAsset();
  const generate = useCreateGeneration(productId);
  const markReviewed = useMarkVariantReviewed(productId);
  const approve = useApproveVariant(productId);
  const dismiss = useDismissVariant(productId);

  const variantBusy = markReviewed.isPending || approve.isPending || dismiss.isPending;
  const selectedProduct = products.find((p) => p.id === productId);

  const onProductChange = (id: string) => {
    setProductId(id);
    setAsset(null);
  };
  const onPresetChange = (next: MediaStudioSourcePreset) => {
    setPreset(next);
    setAsset(null);
  };
  const onAnalyze = () => {
    analyze.mutate({ productId, preset }, { onSuccess: (result) => setAsset(result) });
  };
  const onGenerate = () => {
    if (!task) return;
    generate.mutate({ productId, taskType: task, preset });
  };

  const variants = variantsQuery.data ?? [];

  return (
    <Screen
      testID="media-studio-screen"
      title={t('mediaStudio.title')}
      subtitle={t('mediaStudio.subtitle')}
    >

      <SecurityNote messageKey="mediaStudio.safety.note" />

      {/* Provider status + plan hint */}
      <Card title={t('mediaStudio.status.title')}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Ionicons name="color-palette-outline" size={18} color={tokens.color.primary} />
          <Badge tone="warning" label={t('mediaStudio.status.providerMock')} />
        </View>
        <Text variant="caption" tone="muted">
          {t('mediaStudio.status.noRealProvider')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('mediaStudio.status.planHint')}
        </Text>
        {infoQuery.data?.safetyNotices.map((notice) => (
          <View
            key={notice.id}
            style={{
              flexDirection: rowDirection,
              gap: tokens.spacing.xs,
              alignItems: 'flex-start',
            }}
          >
            <Ionicons
              name={
                notice.severity === 'warning' ? 'warning-outline' : 'information-circle-outline'
              }
              size={14}
              color={notice.severity === 'warning' ? tokens.color.warning : tokens.color.info}
            />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {notice.message}
            </Text>
          </View>
        ))}
      </Card>

      {/* Product selector */}
      <Card title={t('mediaStudio.product.title')}>
        <ChoiceGroup
          value={productId}
          onChange={onProductChange}
          testID="media-product-selector"
          choices={products.map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` }))}
        />
        {selectedProduct ? (
          <Text variant="caption" tone="muted">
            {selectedProduct.categories[0]?.name ?? ''}
            {selectedProduct.brand ? ` · ${selectedProduct.brand.name}` : ''}
          </Text>
        ) : null}
      </Card>

      {/* Source quality */}
      <Card title={t('mediaStudio.source.title')}>
        <SourceQualityPanel
          preset={preset}
          onPresetChange={onPresetChange}
          analyzing={analyze.isPending}
          asset={asset}
          onAnalyze={onAnalyze}
          onSelectFix={setTask}
        />
      </Card>

      {/* Task chooser + generate */}
      <Card title={t('mediaStudio.tasks.title')}>
        <TaskChooser selected={task} onSelect={setTask} />
        <View style={{ marginTop: tokens.spacing.md }}>
          <Button
            label={
              generate.isPending
                ? t('mediaStudio.tasks.generating')
                : task
                  ? `${t('mediaStudio.tasks.generate')}: ${t(taskLabelKey(task))}`
                  : t('mediaStudio.tasks.generate')
            }
            disabled={!task || generate.isPending}
            loading={generate.isPending}
            onPress={onGenerate}
            leading={<Ionicons name="sparkles-outline" size={15} color={tokens.color.onPrimary} />}
          />
        </View>
      </Card>

      {/* Output variants */}
      <Card title={t('mediaStudio.output.title')}>
        {variantsQuery.isPending ? (
          <LoadingState label={t('common.loading')} fill={false} />
        ) : variants.length === 0 ? (
          <EmptyState title={t('mediaStudio.output.empty')} icon="images-outline" fill={false} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
            {variants.map((variant) => (
              <OutputVariantCard
                key={variant.id}
                variant={variant}
                busy={variantBusy}
                onReviewed={(id) => markReviewed.mutate(id)}
                onApprove={(id) => approve.mutate(id)}
                onDismiss={(id) => dismiss.mutate(id)}
              />
            ))}
          </View>
        )}
      </Card>

      {/* Promo video concepts */}
      <Card title={t('mediaStudio.video.title')}>
        {infoQuery.isPending ? (
          <LoadingState label={t('common.loading')} fill={false} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
            {(infoQuery.data?.videoConcepts ?? []).map((concept) => (
              <VideoConceptCard key={concept.id} concept={concept} />
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}
