/**
 * RecommendationCard — an actionable, REVIEW-ONLY recommendation. Navigable actions
 * (view product/orders/inventory) deep-link read-only screens; "review campaign", "draft
 * copy", and "open media studio" are disabled placeholders; "mark reviewed" and "dismiss"
 * are mock-only state changes. Nothing is published or mutated on the real store.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Badge, Button, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { AIAdvisorRecommendation, AIAdvisorSuggestedAction } from '@/domain/types';

import { actionLabelKey, isNavigableAction, priorityMeta, recStatusMeta } from '../advisorHelpers';

export interface RecommendationCardProps {
  recommendation: AIAdvisorRecommendation;
  busy?: boolean;
  onReviewed: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function RecommendationCard({
  recommendation,
  busy = false,
  onReviewed,
  onDismiss,
}: RecommendationCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const priority = priorityMeta(recommendation.priority);
  const status = recStatusMeta(recommendation.status);
  const dismissed = recommendation.status === 'dismissed';

  const renderAction = (action: AIAdvisorSuggestedAction) => {
    const label = t(actionLabelKey(action.kind));
    if (isNavigableAction(action.kind)) {
      return (
        <Button
          key={action.kind}
          label={label}
          variant="secondary"
          size="sm"
          disabled={busy}
          onPress={() => action.targetHref && router.navigate(action.targetHref as never)}
        />
      );
    }
    if (action.kind === 'mark_reviewed') {
      return (
        <Button
          key={action.kind}
          label={label}
          variant="secondary"
          size="sm"
          disabled={busy || recommendation.status === 'reviewed'}
          onPress={() => onReviewed(recommendation.id)}
        />
      );
    }
    if (action.kind === 'dismiss') {
      return (
        <Button
          key={action.kind}
          label={label}
          variant="ghost"
          size="sm"
          disabled={busy || dismissed}
          onPress={() => onDismiss(recommendation.id)}
        />
      );
    }
    // review_campaign / draft_copy / open_media_studio — disabled placeholders (no real action).
    // Exception: open_media_studio navigates to the Media Studio when a target is provided.
    if (action.kind === 'open_media_studio' && action.targetHref) {
      const href = action.targetHref;
      return (
        <Button
          key={action.kind}
          label={label}
          variant="secondary"
          size="sm"
          disabled={busy}
          onPress={() => router.navigate(href as never)}
        />
      );
    }
    return (
      <Button
        key={action.kind}
        label={label}
        variant="secondary"
        size="sm"
        disabled
        onPress={() => {}}
      />
    );
  };

  return (
    <Surface bordered padding="md" style={{ gap: tokens.spacing.sm, opacity: dismissed ? 0.6 : 1 }}>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.xs,
          flexWrap: 'wrap',
        }}
      >
        <Text variant="label" style={{ flexShrink: 1 }}>
          {recommendation.title}
        </Text>
        <Badge tone={priority.tone} label={t(priority.labelKey)} />
        <Badge tone={status.tone} label={t(status.labelKey)} />
      </View>
      <Text variant="caption" tone="muted">
        {recommendation.summary}
      </Text>
      <View
        style={{ flexDirection: rowDirection, alignItems: 'flex-start', gap: tokens.spacing.xs }}
      >
        <Ionicons name="bulb-outline" size={16} color={tokens.color.primary} />
        <Text variant="caption" style={{ flex: 1 }}>
          {recommendation.suggestedStep}
        </Text>
      </View>
      <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        {recommendation.actions.map(renderAction)}
      </View>
    </Surface>
  );
}
