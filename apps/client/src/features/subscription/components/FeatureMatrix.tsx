/**
 * FeatureMatrix — the plan comparison table. Rows are features (grouped by category),
 * columns are plans. Availability renders as: included (check), limited / later (badge), or
 * none (dash). Horizontally scrollable so it stays readable on narrow viewports; RTL-aware.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { PlanFeature, PlanFeatureAvailability, SubscriptionPlan } from '@/domain/types';

import {
  availabilityMeta,
  categoryLabelKey,
  groupFeaturesByCategory,
} from '../subscriptionHelpers';

const LABEL_W = 200;
const COL_W = 104;

function AvailabilityCell({
  availability,
}: {
  availability: PlanFeatureAvailability;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const meta = availabilityMeta(availability);
  return (
    <View style={{ width: COL_W, alignItems: 'center', justifyContent: 'center' }}>
      {availability === 'included' ? (
        <Ionicons name="checkmark-circle" size={18} color={tokens.color.success} />
      ) : availability === 'none' ? (
        <Text tone="muted">—</Text>
      ) : (
        <Badge tone={meta.tone} label={t(meta.labelKey)} />
      )}
    </View>
  );
}

export interface FeatureMatrixProps {
  plans: SubscriptionPlan[];
  features: PlanFeature[];
}

export function FeatureMatrix({ plans, features }: FeatureMatrixProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const groups = groupFeaturesByCategory(features);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator testID="plans-feature-matrix">
      <View style={{ minWidth: LABEL_W + plans.length * COL_W }}>
        {/* Header row */}
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            paddingVertical: tokens.spacing.sm,
            borderBottomWidth: tokens.borderWidth.thin,
            borderBottomColor: tokens.color.border,
          }}
        >
          <View style={{ width: LABEL_W }} />
          {plans.map((plan) => (
            <View key={plan.id} style={{ width: COL_W, alignItems: 'center' }}>
              <Text variant="label">{plan.name}</Text>
            </View>
          ))}
        </View>

        {groups.map((group) => (
          <View key={group.category}>
            <Text
              variant="caption"
              tone="muted"
              style={{ paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.xs }}
            >
              {t(categoryLabelKey(group.category))}
            </Text>
            {group.features.map((feature) => (
              <View
                key={feature.id}
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  paddingVertical: tokens.spacing.sm,
                  borderBottomWidth: tokens.borderWidth.hairline,
                  borderBottomColor: tokens.color.border,
                }}
              >
                <View style={{ width: LABEL_W, paddingEnd: tokens.spacing.sm }}>
                  <Text variant="body">{feature.label}</Text>
                </View>
                {plans.map((plan) => (
                  <AvailabilityCell key={plan.id} availability={feature.availability[plan.id]} />
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
