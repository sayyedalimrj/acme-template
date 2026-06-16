/**
 * OutputVariantCard — a single MOCK output variant. Shows a placeholder preview block (no
 * real generated image), title/description, suggested use, status, honest limitations, and
 * review-only actions: Preview (disabled placeholder), Mark reviewed, Approve (mock — nothing
 * is published), Dismiss, and Open product (read-only nav).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Badge, Button, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { MediaStudioOutputVariant } from '@/domain/types';

import {
  suggestedUseLabelKey,
  taskLabelKey,
  toneFgToken,
  toneSoftToken,
  variantStatusMeta,
} from '../mediaStudioHelpers';

export interface OutputVariantCardProps {
  variant: MediaStudioOutputVariant;
  busy?: boolean;
  onReviewed: (id: string) => void;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function OutputVariantCard({
  variant,
  busy = false,
  onReviewed,
  onApprove,
  onDismiss,
}: OutputVariantCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const status = variantStatusMeta(variant.status);
  const dismissed = variant.status === 'dismissed';

  return (
    <Surface
      bordered
      padding="none"
      style={{
        flexGrow: 1,
        flexBasis: 300,
        minWidth: 260,
        overflow: 'hidden',
        opacity: dismissed ? 0.6 : 1,
      }}
    >
      {/* Placeholder preview block — no real generated asset. */}
      <View
        style={{
          height: 110,
          backgroundColor: tokens.color[toneSoftToken(variant.tone)],
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Ionicons
          name="sparkles-outline"
          size={24}
          color={tokens.color[toneFgToken(variant.tone)]}
        />
        <Text variant="caption" style={{ color: tokens.color[toneFgToken(variant.tone)] }}>
          {t('mediaStudio.output.placeholder')}
        </Text>
      </View>

      <View style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm }}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Text variant="label" style={{ flexShrink: 1 }}>
            {variant.title}
          </Text>
          <Badge tone={status.tone} label={t(status.labelKey)} />
        </View>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
          <Badge tone="neutral" label={t(taskLabelKey(variant.taskType))} />
          <Badge tone="info" label={t(suggestedUseLabelKey(variant.suggestedUse))} />
        </View>
        <Text variant="caption" tone="muted">
          {variant.description}
        </Text>

        {variant.limitations.map((limit) => (
          <View
            key={limit}
            style={{
              flexDirection: rowDirection,
              gap: tokens.spacing.xs,
              alignItems: 'flex-start',
            }}
          >
            <Ionicons name="alert-circle-outline" size={14} color={tokens.color.warning} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {limit}
            </Text>
          </View>
        ))}

        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
          <Button
            label={t('mediaStudio.action.preview')}
            variant="secondary"
            size="sm"
            disabled
            onPress={() => {}}
          />
          <Button
            label={t('mediaStudio.action.markReviewed')}
            variant="secondary"
            size="sm"
            disabled={busy || variant.status === 'reviewed'}
            onPress={() => onReviewed(variant.id)}
          />
          <Button
            label={t('mediaStudio.action.approve')}
            variant="primary"
            size="sm"
            disabled={busy || variant.status === 'approved'}
            onPress={() => onApprove(variant.id)}
          />
          <Button
            label={t('mediaStudio.action.openProduct')}
            variant="secondary"
            size="sm"
            disabled={busy}
            onPress={() => router.navigate(`/products/${variant.productId}` as never)}
          />
          <Button
            label={t('mediaStudio.action.dismiss')}
            variant="ghost"
            size="sm"
            disabled={busy || dismissed}
            onPress={() => onDismiss(variant.id)}
          />
        </View>
      </View>
    </Surface>
  );
}
