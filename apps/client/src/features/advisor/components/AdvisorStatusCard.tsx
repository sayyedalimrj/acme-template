/**
 * AdvisorStatusCard — states clearly that this is a mock advisor with no real AI connected,
 * and shows a (non-enforced) plan gating hint based on the current subscription plan.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Card, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SubscriptionPlanId } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

export interface AdvisorStatusCardProps {
  planId: SubscriptionPlanId;
  planName: string;
}

function planHintKey(planId: SubscriptionPlanId): StringKey {
  switch (planId) {
    case 'starter':
      return 'advisor.status.planHintStarter';
    case 'growth':
      return 'advisor.status.planHintGrowth';
    case 'pro':
    case 'managed':
    default:
      return 'advisor.status.planHintPro';
  }
}

export function AdvisorStatusCard({ planId, planName }: AdvisorStatusCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <Card title={t('advisor.status.title')} testID="advisor-status">
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Ionicons name="sparkles-outline" size={18} color={tokens.color.primary} />
        <Badge tone="warning" label={t('advisor.status.providerMock')} />
        <Badge tone="neutral" label={planName} />
      </View>
      <Text variant="caption" tone="muted">
        {t('advisor.status.noRealAI')}
      </Text>
      <Text variant="caption" tone="muted">
        {t(planHintKey(planId))}
      </Text>
    </Card>
  );
}
