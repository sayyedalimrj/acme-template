/**
 * SupportSummaryCards — at-a-glance operational counts for the queue (open, urgent/high,
 * awaiting customer, ready/scheduled). Responsive row of tinted stat widgets built from
 * existing primitives.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { View } from 'react-native';

import { Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme, type ColorTokens } from '@/theme';
import type { SupportOperationsSummary } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface CardDef {
  key: keyof SupportOperationsSummary;
  labelKey: StringKey;
  icon: IoniconName;
  soft: keyof ColorTokens;
  fg: keyof ColorTokens;
}

const CARDS: CardDef[] = [
  {
    key: 'totalOpen',
    labelKey: 'support.summary.totalOpen',
    icon: 'albums-outline',
    soft: 'primarySoft',
    fg: 'primary',
  },
  {
    key: 'urgentOrHigh',
    labelKey: 'support.summary.urgentHigh',
    icon: 'alert-circle-outline',
    soft: 'dangerSoft',
    fg: 'danger',
  },
  {
    key: 'awaitingCustomer',
    labelKey: 'support.summary.awaitingCustomer',
    icon: 'hourglass-outline',
    soft: 'warningSoft',
    fg: 'warning',
  },
  {
    key: 'readyForReviewOrConnection',
    labelKey: 'support.summary.readyConnect',
    icon: 'checkmark-done-outline',
    soft: 'successSoft',
    fg: 'success',
  },
];

export interface SupportSummaryCardsProps {
  summary: SupportOperationsSummary;
}

export function SupportSummaryCards({ summary }: SupportSummaryCardsProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
      {CARDS.map((card) => (
        <Surface
          key={card.key}
          bordered
          padding="md"
          style={{
            flexGrow: 1,
            flexBasis: 160,
            minWidth: 150,
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.md,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color[card.soft],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={card.icon} size={22} color={tokens.color[card.fg]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="title">{String(summary[card.key])}</Text>
            <Text variant="caption" tone="muted">
              {t(card.labelKey)}
            </Text>
          </View>
        </Surface>
      ))}
    </View>
  );
}
