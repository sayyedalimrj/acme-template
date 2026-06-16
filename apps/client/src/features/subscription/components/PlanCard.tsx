/**
 * PlanCard — a single pricing card: plan name, recommended badge, display-only price for the
 * selected interval, tagline, top feature bullets, and a plan action button.
 *
 * The action buttons are intentionally DISABLED placeholders (no real billing): "current
 * plan", "request upgrade", "change plan", or "contact support". A global note on the screen
 * explains that real billing arrives later via the backend + provider.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Button, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type {
  BillingInterval,
  PlanActionState,
  PlanPricing,
  SubscriptionPlan,
} from '@/domain/types';

import { planActionLabelKey, priceForInterval } from '../subscriptionHelpers';

export interface PlanCardProps {
  plan: SubscriptionPlan;
  pricing?: PlanPricing;
  interval: BillingInterval;
  action: PlanActionState;
}

export function PlanCard({ plan, pricing, interval, action }: PlanCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const isCurrent = action === 'current';
  const price = pricing ? priceForInterval(pricing, interval) : undefined;

  return (
    <Surface
      bordered
      padding="lg"
      style={{
        flexGrow: 1,
        flexBasis: 240,
        minWidth: 220,
        gap: tokens.spacing.sm,
        borderColor: plan.recommended ? tokens.color.primary : tokens.color.border,
        borderWidth: plan.recommended ? tokens.borderWidth.thick : tokens.borderWidth.hairline,
      }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.xs,
          flexWrap: 'wrap',
        }}
      >
        <Text variant="subheading">{plan.name}</Text>
        {plan.recommended ? <Badge tone="primary" label={t('plans.recommended')} /> : null}
        {isCurrent ? <Badge tone="success" label={t('plans.action.current')} /> : null}
      </View>

      {price ? (
        <View style={{ gap: 2 }}>
          <Text variant="title" tone="primary">
            {price.amountLabel}
          </Text>
          <Text variant="caption" tone="muted">
            {price.periodLabel}
            {pricing?.savingsLabel && interval === 'yearly' ? ` · ${pricing.savingsLabel}` : ''}
          </Text>
          {price.note ? (
            <Text variant="caption" tone="muted">
              {price.note}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text variant="caption" tone="muted">
        {plan.tagline}
      </Text>

      <View style={{ gap: tokens.spacing.xs, marginTop: tokens.spacing.xs }}>
        {plan.features.map((feature) => (
          <View
            key={feature}
            style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={tokens.color.success} />
            <Text variant="caption" style={{ flex: 1 }}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Action is a disabled placeholder — no real billing in this mock. */}
      <Button
        label={t(planActionLabelKey(action))}
        variant={action === 'upgrade' ? 'primary' : 'secondary'}
        size="sm"
        disabled
        onPress={() => {}}
      />
    </Surface>
  );
}
