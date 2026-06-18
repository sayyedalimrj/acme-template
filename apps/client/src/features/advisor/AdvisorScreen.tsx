/**
 * AI Business Advisor (index) — a mock commerce assistant.
 *
 * Sections: store-context summary, advisor status (mock provider + plan hint), prompt chips,
 * a deterministic mock chat, insights, and review-only recommendations grouped by category.
 *
 * SECURITY: MOCK-ONLY. No real AI provider/API, no external calls, no secrets. Every
 * suggestion is review-only; nothing is published, no product/order is mutated, and no
 * customer message is sent automatically (see security-model.md).
 */
import React from 'react';
import { View } from 'react-native';

import { Card, EmptyState, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { AdvisorStatusCard } from './components/AdvisorStatusCard';
import { ConversationPanel } from './components/ConversationPanel';
import { InsightCard } from './components/InsightCard';
import { PromptSuggestions } from './components/PromptSuggestions';
import { RecommendationCard } from './components/RecommendationCard';
import { StoreContextCard } from './components/StoreContextCard';
import { categoryLabelKey, groupRecommendations } from './advisorHelpers';
import {
  useAdvisorConversation,
  useAdvisorOverview,
  useAdvisorRecommendations,
} from './useAdvisor';
import {
  useDismissRecommendation,
  useMarkRecommendationReviewed,
  useSendAdvisorMessage,
} from './useAdvisorMutations';

export function AdvisorScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  const overviewQuery = useAdvisorOverview();
  const recommendationsQuery = useAdvisorRecommendations();
  const conversationQuery = useAdvisorConversation();
  const sendMessage = useSendAdvisorMessage();
  const markReviewed = useMarkRecommendationReviewed();
  const dismiss = useDismissRecommendation();

  const recsBusy = markReviewed.isPending || dismiss.isPending;
  const groups = groupRecommendations(recommendationsQuery.data ?? []);

  return (
    <Screen testID="advisor-screen" title={t('advisor.title')} subtitle={t('advisor.subtitle')}>

      <SecurityNote messageKey="advisor.safety.note" />

      {overviewQuery.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : overviewQuery.isError || !overviewQuery.data ? (
        <ErrorState
          title={t('advisor.error')}
          retryLabel={t('common.retry')}
          onRetry={() => overviewQuery.refetch()}
          fill={false}
        />
      ) : (
        <>
          <AdvisorStatusCard
            planId={overviewQuery.data.context.planId}
            planName={overviewQuery.data.context.planName}
          />

          <StoreContextCard context={overviewQuery.data.context} />

          <Card title={t('advisor.chat.title')}>
            <Text variant="caption" tone="muted">
              {t('advisor.prompts.title')}
            </Text>
            <PromptSuggestions
              prompts={overviewQuery.data.prompts}
              disabled={sendMessage.isPending}
              onSelect={(text) => sendMessage.mutate(text)}
            />
            {conversationQuery.data ? (
              <View style={{ marginTop: tokens.spacing.md }}>
                <ConversationPanel
                  messages={conversationQuery.data}
                  sending={sendMessage.isPending}
                  onSend={(text) => sendMessage.mutate(text)}
                />
              </View>
            ) : (
              <LoadingState label={t('common.loading')} fill={false} />
            )}
          </Card>

          <Card title={t('advisor.insights.title')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
              {overviewQuery.data.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          </Card>

          <Card title={t('advisor.recommendations.title')}>
            {recommendationsQuery.isPending ? (
              <LoadingState label={t('common.loading')} fill={false} />
            ) : recommendationsQuery.isError ? (
              <ErrorState
                title={t('advisor.error')}
                retryLabel={t('common.retry')}
                onRetry={() => recommendationsQuery.refetch()}
                fill={false}
              />
            ) : groups.length === 0 ? (
              <EmptyState title={t('advisor.empty')} icon="sparkles-outline" fill={false} />
            ) : (
              <View style={{ gap: tokens.spacing.lg }}>
                {groups.map((group) => (
                  <View key={group.category} style={{ gap: tokens.spacing.sm }}>
                    <Text variant="subheading">{t(categoryLabelKey(group.category))}</Text>
                    {group.recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        busy={recsBusy}
                        onReviewed={(id) => markReviewed.mutate(id)}
                        onDismiss={(id) => dismiss.mutate(id)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
