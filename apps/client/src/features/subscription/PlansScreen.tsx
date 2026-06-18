/**
 * Plans & subscription (index).
 *
 * Makes the business model visible in-product: the current (mock) subscription, a
 * monthly/yearly toggle, pricing cards for the four plans, and a feature-comparison matrix.
 * MOCK-ONLY and FRONTEND-SAFE — prices are display-only, plan actions are disabled
 * placeholders, and a clear note states real billing arrives later via the backend +
 * provider. No payment data is collected (see security-model.md).
 */
import React, { useState } from 'react';
import { View } from 'react-native';

import { Card, ErrorState, LoadingState, Screen } from '@/components/ui';
import { ChoiceGroup } from '@/features/onboarding/components/ChoiceGroup';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { BillingInterval } from '@/domain/types';

import { CurrentPlanCard } from './components/CurrentPlanCard';
import { FeatureMatrix } from './components/FeatureMatrix';
import { PlanCard } from './components/PlanCard';
import { DurationPricingTable } from './durationPricing/DurationPricingTable';
import { durationPricingConfig } from './durationPricing/durationPricingConfig';
import { BILLING_INTERVALS, findPricing, planActionState } from './subscriptionHelpers';
import { useSubscriptionOverview } from './useSubscription';

export function PlansScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const overviewQuery = useSubscriptionOverview();
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <Screen testID="plans-screen" title={t('plans.title')} subtitle={t('plans.subtitle')}>
      <SecurityNote messageKey="plans.billing.note" />

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

          <Card title={t('plans.choosePlan')}>
            <ChoiceGroup
              value={interval}
              onChange={setInterval}
              testID="plans-interval-toggle"
              choices={BILLING_INTERVALS.map((value) => ({
                value,
                label:
                  value === 'monthly' ? t('plans.interval.monthly') : t('plans.interval.yearly'),
              }))}
            />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: tokens.spacing.lg,
                marginTop: tokens.spacing.md,
              }}
            >
              {overviewQuery.data.plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  pricing={findPricing(overviewQuery.data.pricing, plan.id)}
                  interval={interval}
                  action={planActionState(plan.id, overviewQuery.data.current.planId)}
                />
              ))}
            </View>
          </Card>

          <Card title={t('plans.compare')}>
            <FeatureMatrix
              plans={overviewQuery.data.plans}
              features={overviewQuery.data.features}
            />
          </Card>

          <Card title={durationPricingConfig.subscriptionName}>
            <DurationPricingTable />
          </Card>
        </>
      )}
    </Screen>
  );
}
