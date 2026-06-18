/**
 * Customer Intelligence (index) — mock event-tracking & shopper-intelligence model.
 *
 * Sections: header + privacy note, tracking readiness, intelligence summary, search demand,
 * product interest, abandoned carts + campaign readiness, review-only recommendations, and a
 * clearly-labelled dev/mock event recorder.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real tracking, no cookies/fingerprints, no analytics
 * provider, no external send, no PII beyond mock data (see security-model.md).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Surface,
  Text,
} from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { CommerceEventType, EventReadinessState, IntelligenceSummary } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  campaignReadinessMeta,
  categoryLabelKey,
  conversionMeta,
  groupRecommendations,
  intentMeta,
  opportunityMeta,
  readinessMeta,
  recStatusMeta,
} from './intelligenceHelpers';
import {
  useIntelligenceEvents,
  useIntelligenceOverview,
  useIntelligenceRecommendations,
} from './useIntelligence';
import {
  useDismissRecommendation,
  useMarkRecommendationReviewed,
  useRecordEvent,
} from './useIntelligenceMutations';

function SummaryStat({
  labelKey,
  value,
}: {
  labelKey: StringKey;
  value: string;
}): React.JSX.Element {
  const t = useT();
  return (
    <Surface
      variant="surfaceAlt"
      padding="sm"
      style={{ flexGrow: 1, flexBasis: 150, minWidth: 130, gap: 2 }}
    >
      <Text variant="caption" tone="muted">
        {t(labelKey)}
      </Text>
      <Text variant="subheading">{value}</Text>
    </Surface>
  );
}

const SUMMARY_ROWS: { key: keyof IntelligenceSummary; labelKey: StringKey }[] = [
  { key: 'totalEvents', labelKey: 'intel.summary.totalEvents' },
  { key: 'activeShoppers', labelKey: 'intel.summary.activeShoppers' },
  { key: 'interestedShoppers', labelKey: 'intel.summary.interestedShoppers' },
  { key: 'abandonedCarts', labelKey: 'intel.summary.abandonedCarts' },
  { key: 'backInStockInterests', labelKey: 'intel.summary.backInStock' },
  { key: 'campaignInteractions', labelKey: 'intel.summary.campaignInteractions' },
  { key: 'conversionReady', labelKey: 'intel.summary.conversionReady' },
];

const READINESS_ROWS: {
  key: keyof import('@/domain/types').EventTrackingReadiness;
  labelKey: StringKey;
}[] = [
  { key: 'trackingProvider', labelKey: 'intel.readinessRow.trackingProvider' },
  { key: 'wordpressPlugin', labelKey: 'intel.readinessRow.wordpressPlugin' },
  { key: 'backendPipeline', labelKey: 'intel.readinessRow.backendPipeline' },
  { key: 'consentModel', labelKey: 'intel.readinessRow.consentModel' },
  { key: 'webhooks', labelKey: 'intel.readinessRow.webhooks' },
];

const MOCK_EVENT_BUTTONS: { type: CommerceEventType; labelKey: StringKey }[] = [
  { type: 'site_search', labelKey: 'intel.record.search' },
  { type: 'product_view', labelKey: 'intel.record.view' },
  { type: 'add_to_cart', labelKey: 'intel.record.cart' },
  { type: 'back_in_stock_subscribe', labelKey: 'intel.record.backInStock' },
];

export function IntelligenceScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const overviewQuery = useIntelligenceOverview();
  const recommendationsQuery = useIntelligenceRecommendations();
  const eventsQuery = useIntelligenceEvents();
  const recordEvent = useRecordEvent();
  const markReviewed = useMarkRecommendationReviewed();
  const dismiss = useDismissRecommendation();

  const recsBusy = markReviewed.isPending || dismiss.isPending;
  const groups = groupRecommendations(recommendationsQuery.data ?? []);

  return (
    <Screen testID="intelligence-screen" title={t('intel.title')} subtitle={t('intel.subtitle')}>

      <SecurityNote messageKey="intel.safety.note" />

      {overviewQuery.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : overviewQuery.isError || !overviewQuery.data ? (
        <ErrorState
          title={t('intel.error')}
          retryLabel={t('common.retry')}
          onRetry={() => overviewQuery.refetch()}
          fill={false}
        />
      ) : (
        <>
          {/* B. Readiness */}
          <Card title={t('intel.readinessTitle')}>
            {READINESS_ROWS.map((row, index) => {
              const meta = readinessMeta(
                overviewQuery.data.readiness[row.key] as EventReadinessState,
              );
              return (
                <View key={row.key}>
                  {index > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: tokens.spacing.sm,
                      paddingVertical: tokens.spacing.xs,
                    }}
                  >
                    <Text variant="label">{t(row.labelKey)}</Text>
                    <Badge tone={meta.tone} label={t(meta.labelKey)} />
                  </View>
                </View>
              );
            })}
          </Card>

          {/* C. Summary */}
          <Card title={t('intel.summaryTitle')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
              {SUMMARY_ROWS.map((row) => (
                <SummaryStat
                  key={row.key}
                  labelKey={row.labelKey}
                  value={String(overviewQuery.data.summary[row.key])}
                />
              ))}
            </View>
            {overviewQuery.data.summary.topSearchTerms.length > 0 ? (
              <Text variant="caption" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
                {t('intel.summary.topSearches')}:{' '}
                {overviewQuery.data.summary.topSearchTerms
                  .map((s) => `${s.term} (${s.count})`)
                  .join('، ')}
              </Text>
            ) : null}
          </Card>

          {/* D. Search demand */}
          <Card title={t('intel.searchDemandTitle')}>
            {overviewQuery.data.search.map((insight, index) => {
              const meta = opportunityMeta(insight.opportunity);
              return (
                <View key={insight.id}>
                  {index > 0 ? <Divider /> : null}
                  <View style={{ paddingVertical: tokens.spacing.sm, gap: 4 }}>
                    <View
                      style={{
                        flexDirection: rowDirection,
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text variant="label" style={{ flexShrink: 1 }}>
                        {insight.term}
                      </Text>
                      <Badge tone="neutral" label={`${insight.count}`} />
                      <Badge
                        tone={insight.matched ? 'success' : 'warning'}
                        label={
                          insight.matched ? t('intel.search.matched') : t('intel.search.noMatch')
                        }
                      />
                      <Badge tone={meta.tone} label={t(meta.labelKey)} />
                    </View>
                    <Text variant="caption" tone="muted">
                      {insight.suggestedAction}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {/* E. Product interest */}
          <Card title={t('intel.productInterestTitle')}>
            {overviewQuery.data.products.map((signal, index) => {
              const meta = conversionMeta(signal.conversionSignal);
              return (
                <View key={signal.id}>
                  {index > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      gap: tokens.spacing.sm,
                      paddingVertical: tokens.spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="label" numberOfLines={1}>
                        {signal.productName}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {t('intel.product.views')}: {signal.views} · {t('intel.product.cartAdds')}:{' '}
                        {signal.cartAdds} · {t('intel.product.subscribers')}:{' '}
                        {signal.backInStockSubscribers}
                      </Text>
                    </View>
                    <Badge tone={meta.tone} label={t(meta.labelKey)} />
                  </View>
                </View>
              );
            })}
          </Card>

          {/* F. Abandoned carts + campaign readiness */}
          <Card title={t('intel.abandonedTitle')}>
            {overviewQuery.data.abandoned.map((cart, index) => (
              <View key={cart.id}>
                {index > 0 ? <Divider /> : null}
                <View style={{ paddingVertical: tokens.spacing.sm, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      gap: tokens.spacing.xs,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Text variant="label">{cart.actor.label}</Text>
                    <Badge tone="warning" label={`${cart.estimatedValue} ${cart.currency}`} />
                  </View>
                  <Text variant="caption" tone="muted">
                    {cart.items.map((i) => i.productName).join('، ')}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {cart.recommendedFollowUp}
                  </Text>
                </View>
              </View>
            ))}
            <Divider />
            <Text variant="label" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
              {t('intel.campaignTitle')}
            </Text>
            {overviewQuery.data.campaigns.map((c) => {
              const meta = campaignReadinessMeta(c.readiness);
              return (
                <View
                  key={c.id}
                  style={{
                    flexDirection: rowDirection,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                  }}
                >
                  <Text variant="label" style={{ flex: 1 }}>
                    {c.campaign}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {c.clicks} / {c.conversions}
                  </Text>
                  <Badge tone={meta.tone} label={t(meta.labelKey)} />
                </View>
              );
            })}
          </Card>

          {/* G. Recommendations */}
          <Card title={t('intel.recommendationsTitle')}>
            {recommendationsQuery.isPending ? (
              <LoadingState label={t('common.loading')} fill={false} />
            ) : groups.length === 0 ? (
              <EmptyState title={t('intel.empty')} icon="analytics-outline" fill={false} />
            ) : (
              <View style={{ gap: tokens.spacing.lg }}>
                {groups.map((group) => (
                  <View key={group.category} style={{ gap: tokens.spacing.sm }}>
                    <Text variant="subheading">{t(categoryLabelKey(group.category))}</Text>
                    {group.recommendations.map((rec) => {
                      const priority = intentMeta(rec.priority);
                      const status = recStatusMeta(rec.status);
                      const dismissed = rec.status === 'dismissed';
                      return (
                        <Surface
                          key={rec.id}
                          bordered
                          padding="md"
                          style={{ gap: tokens.spacing.sm, opacity: dismissed ? 0.6 : 1 }}
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
                              {rec.title}
                            </Text>
                            <Badge tone={priority.tone} label={t(priority.labelKey)} />
                            <Badge tone={status.tone} label={t(status.labelKey)} />
                          </View>
                          <Text variant="caption" tone="muted">
                            {rec.summary}
                          </Text>
                          <Text variant="caption" tone="muted">
                            {rec.suggestedStep}
                          </Text>
                          <View
                            style={{
                              flexDirection: rowDirection,
                              flexWrap: 'wrap',
                              gap: tokens.spacing.sm,
                            }}
                          >
                            {rec.href ? (
                              <Button
                                label={t('intel.action.open')}
                                variant="secondary"
                                size="sm"
                                disabled={recsBusy}
                                onPress={() => go(rec.href as string)}
                              />
                            ) : null}
                            <Button
                              label={t('intel.action.markReviewed')}
                              variant="secondary"
                              size="sm"
                              disabled={recsBusy || rec.status === 'reviewed'}
                              onPress={() => markReviewed.mutate(rec.id)}
                            />
                            <Button
                              label={t('intel.action.dismiss')}
                              variant="ghost"
                              size="sm"
                              disabled={recsBusy || dismissed}
                              onPress={() => dismiss.mutate(rec.id)}
                            />
                          </View>
                        </Surface>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Dev/mock event recorder */}
          <Card title={t('intel.record.title')}>
            <View
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: tokens.spacing.xs,
                marginBottom: tokens.spacing.sm,
              }}
            >
              <Ionicons name="construct-outline" size={16} color={tokens.color.warning} />
              <Badge tone="warning" label={t('intel.record.devOnly')} />
            </View>
            <Text variant="caption" tone="muted">
              {t('intel.record.note')}
            </Text>
            <View
              style={{
                flexDirection: rowDirection,
                flexWrap: 'wrap',
                gap: tokens.spacing.sm,
                marginTop: tokens.spacing.sm,
              }}
            >
              {MOCK_EVENT_BUTTONS.map((btn) => (
                <Button
                  key={btn.type}
                  label={t(btn.labelKey)}
                  variant="secondary"
                  size="sm"
                  disabled={recordEvent.isPending}
                  onPress={() => recordEvent.mutate({ type: btn.type })}
                />
              ))}
            </View>
            <Text variant="caption" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
              {t('intel.record.count')}:{' '}
              {eventsQuery.data?.length ?? overviewQuery.data.summary.totalEvents}
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
