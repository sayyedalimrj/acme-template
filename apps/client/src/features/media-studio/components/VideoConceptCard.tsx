/**
 * VideoConceptCard — a MOCK promo-video concept / storyboard (no real video generation).
 * Shows goal, scene list, caption/CTA ideas, and recommended channel.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { MediaStudioVideoConcept } from '@/domain/types';

export interface VideoConceptCardProps {
  concept: MediaStudioVideoConcept;
}

export function VideoConceptCard({ concept }: VideoConceptCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();

  return (
    <Surface
      bordered
      padding="md"
      style={{ flexGrow: 1, flexBasis: 300, minWidth: 260, gap: tokens.spacing.sm }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Ionicons name="videocam-outline" size={18} color={tokens.color.primary} />
        <Text variant="label" style={{ flexShrink: 1 }}>
          {concept.title}
        </Text>
        <Badge tone="neutral" label={concept.channel} />
      </View>
      <Text variant="caption" tone="muted">
        {t('mediaStudio.video.goal')}: {concept.goal}
      </Text>

      <View style={{ gap: tokens.spacing.xs }}>
        {concept.scenes.map((scene) => (
          <View
            key={scene.order}
            style={{
              flexDirection: rowDirection,
              gap: tokens.spacing.sm,
              alignItems: 'flex-start',
            }}
          >
            <Badge tone="info" label={String(scene.order)} />
            <Text variant="caption" style={{ flex: 1 }}>
              {scene.description}
              {scene.durationLabel ? ` (${scene.durationLabel})` : ''}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="caption" tone="muted">
        {t('mediaStudio.video.caption')}: {concept.captionIdea}
      </Text>
      <Text variant="caption" tone="muted">
        {t('mediaStudio.video.cta')}: {concept.ctaIdea}
      </Text>
    </Surface>
  );
}
