/**
 * PlanPicker — selectable subscription plan cards (placeholder only, no billing).
 *
 * Shows each plan's name, display-only price label, tagline, feature highlights, and whether
 * managed setup / future growth channels (AI & SMS) are included. A clear note states no real
 * payment is taken. Selection is local UI state used by the new-store launch form.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Button, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SubscriptionPlan, SubscriptionPlanId } from '@/domain/types';

interface PlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: (id: SubscriptionPlanId) => void;
}

function PlanCard({ plan, selected, onSelect }: PlanCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <Surface
      bordered
      padding="lg"
      style={{
        flexGrow: 1,
        flexBasis: 240,
        minWidth: 220,
        gap: tokens.spacing.sm,
        borderColor: selected ? tokens.color.primary : tokens.color.border,
        borderWidth: selected ? tokens.borderWidth.thick : tokens.borderWidth.hairline,
      }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Text variant="subheading">{plan.name}</Text>
        {plan.recommended ? (
          <Badge tone="primary" label={t('onboarding.plan.recommended')} />
        ) : null}
      </View>
      <Text variant="heading" tone="primary">
        {plan.priceLabel}
      </Text>
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

      <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
        {plan.supportSetupIncluded ? (
          <Badge tone="success" label={t('onboarding.plan.supportIncluded')} />
        ) : null}
        {plan.growthChannelsLater ? (
          <Badge tone="info" label={t('onboarding.plan.growthLater')} />
        ) : null}
      </View>

      <Button
        label={selected ? t('onboarding.plan.selected') : t('onboarding.plan.select')}
        variant={selected ? 'primary' : 'secondary'}
        size="sm"
        onPress={() => onSelect(plan.id)}
        leading={
          selected ? (
            <Ionicons name="checkmark" size={16} color={tokens.color.onPrimary} />
          ) : undefined
        }
      />
    </Surface>
  );
}

export interface PlanPickerProps {
  plans: SubscriptionPlan[];
  selectedId: SubscriptionPlanId | null;
  onSelect: (id: SubscriptionPlanId) => void;
  testID?: string;
}

export function PlanPicker({
  plans,
  selectedId,
  onSelect,
  testID,
}: PlanPickerProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  return (
    <View testID={testID} style={{ gap: tokens.spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.lg }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedId === plan.id}
            onSelect={onSelect}
          />
        ))}
      </View>
      <Text variant="caption" tone="muted">
        {t('onboarding.plan.billingNote')}
      </Text>
    </View>
  );
}
