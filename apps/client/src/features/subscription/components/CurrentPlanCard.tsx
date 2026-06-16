/**
 * CurrentPlanCard — summarizes the merchant's current (mock) subscription: plan name,
 * status, interval, display-only price, and a frontend-safe renewal note. No billing IDs.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Card, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { CurrentSubscriptionSummary } from '@/domain/types';

export interface CurrentPlanCardProps {
  current: CurrentSubscriptionSummary;
}

export function CurrentPlanCard({ current }: CurrentPlanCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const statusLabel =
    current.status === 'trialing' ? t('plans.status.trialing') : t('plans.status.active');
  const intervalLabel =
    current.interval === 'monthly' ? t('plans.interval.monthly') : t('plans.interval.yearly');

  return (
    <Card title={t('plans.current.title')} testID="plans-current">
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="ribbon-outline" size={22} color={tokens.color.primary} />
        </View>
        <View style={{ flex: 1, gap: 2, minWidth: 160 }}>
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: tokens.spacing.xs,
              flexWrap: 'wrap',
            }}
          >
            <Text variant="subheading">{current.planName}</Text>
            <Badge tone="info" label={statusLabel} />
            <Badge tone="neutral" label={intervalLabel} />
          </View>
          <Text variant="caption" tone="muted">
            {current.priceLabel}
          </Text>
        </View>
      </View>
      {current.renewalNote ? (
        <Text variant="caption" tone="muted">
          {current.renewalNote}
        </Text>
      ) : null}
    </Card>
  );
}
