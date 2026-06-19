/**
 * Plans & subscription (index) — simplified.
 *
 * Top: the merchant's current (mock) subscription. Below: a single renewal card with a 4-option
 * duration selector (1/3/6/12 months) and the resulting price. No comparison matrix, no
 * up-front legal blurb.
 *
 * MOCK-ONLY and FRONTEND-SAFE — prices are display-only labels, the renew action is a disabled
 * placeholder, and no payment data is collected (see security-model.md).
 */
import React, { useState } from 'react';
import { View } from 'react-native';

import { Badge, Card, ErrorState, LoadingState, MockActionButton, Screen, Text } from '@/components/ui';
import { SegmentedControl } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { CurrentPlanCard } from './components/CurrentPlanCard';
import {
  DEFAULT_DURATION_MONTHS,
  DURATION_OPTIONS,
  findDuration,
  type SubscriptionDurationMonths,
} from './planDurations';
import { useSubscriptionOverview } from './useSubscription';

export function PlansScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const overviewQuery = useSubscriptionOverview();
  const [months, setMonths] = useState<SubscriptionDurationMonths>(DEFAULT_DURATION_MONTHS);

  const selected = findDuration(months);

  return (
    <Screen testID="plans-screen" title={t('plans.title')}>
      {overviewQuery.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : overviewQuery.isError || !overviewQuery.data ? (
        <ErrorState
          title={t('plans.error')}
          retryLabel={t('common.retry')}
          onRetry={() => overviewQuery.refetch()}
          fill={false}
        />
      ) : (
        <>
          <CurrentPlanCard current={overviewQuery.data.current} />

          <Card title={t('plans.renew.title')} testID="plans-renew">
            <Text variant="caption" tone="muted">
              {t('plans.renew.subtitle')}
            </Text>

            <SegmentedControl<string>
              testID="plans-duration-selector"
              stretch
              value={String(months)}
              onChange={(value) => setMonths(Number(value) as SubscriptionDurationMonths)}
              options={DURATION_OPTIONS.map((option) => ({
                value: String(option.months),
                label: t(option.labelKey),
              }))}
              style={{ marginTop: tokens.spacing.sm }}
            />

            {/* Price block for the selected duration */}
            <View
              style={{
                marginTop: tokens.spacing.md,
                padding: tokens.spacing.lg,
                borderRadius: tokens.radius.lg,
                backgroundColor: tokens.color.primarySoft,
                gap: tokens.spacing.xs,
                alignItems: 'center',
              }}
            >
              <Text variant="caption" tone="muted">
                {t('plans.renew.payable')}
              </Text>
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'baseline',
                  gap: tokens.spacing.xs,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Text variant="display" style={{ color: tokens.color.primary }}>
                  {selected.totalAmount}
                </Text>
                <Text variant="subheading" style={{ color: tokens.color.primary }}>
                  {t('plans.currency')}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Text variant="caption" tone="muted">
                  {t('plans.duration.perMonth')}: {selected.perMonthAmount} {t('plans.currency')}
                </Text>
                {selected.savingsKey ? (
                  <Badge tone="success" label={t(selected.savingsKey)} />
                ) : null}
              </View>
            </View>

            <View style={{ marginTop: tokens.spacing.md, alignItems: 'center' }}>
              <MockActionButton
                testID="plans-renew-cta"
                label={t('plans.renew.cta')}
                note={t('plans.renew.note')}
                variant="primary"
                style={{ alignSelf: 'center' }}
              />
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}
