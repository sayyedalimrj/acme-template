/**
 * InsightCard — a single read-only store insight (title, summary, priority, suggested step).
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { AIAdvisorInsight } from '@/domain/types';

import { priorityMeta } from '../advisorHelpers';

export interface InsightCardProps {
  insight: AIAdvisorInsight;
}

export function InsightCard({ insight }: InsightCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const priority = priorityMeta(insight.priority);

  return (
    <Surface
      bordered
      padding="md"
      style={{ flexGrow: 1, flexBasis: 280, minWidth: 240, gap: tokens.spacing.xs }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.xs,
          flexWrap: 'wrap',
        }}
      >
        <Text variant="label" style={{ flexShrink: 1 }}>
          {insight.title}
        </Text>
        <Badge tone={priority.tone} label={t(priority.labelKey)} />
      </View>
      <Text variant="caption" tone="muted">
        {insight.summary}
      </Text>
      <View
        style={{ flexDirection: rowDirection, alignItems: 'flex-start', gap: tokens.spacing.xs }}
      >
        <Ionicons name="arrow-forward-circle-outline" size={16} color={tokens.color.primary} />
        <Text variant="caption" style={{ flex: 1 }}>
          {insight.suggestedStep}
        </Text>
      </View>
    </Surface>
  );
}
