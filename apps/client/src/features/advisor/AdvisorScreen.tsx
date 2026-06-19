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
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Card, EmptyState, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { AdvisorStatusCard } from './components/AdvisorStatusCard';
import { ChatHistoryPanel } from './components/ChatHistoryPanel';
import { ConversationPanel } from './components/ConversationPanel';
import { InsightCard } from './components/InsightCard';
import { PromptSuggestions } from './components/PromptSuggestions';
import { RecommendationCard } from './components/RecommendationCard';
import { StoreContextCard } from './components/StoreContextCard';
import { categoryLabelKey, groupRecommendations } from './advisorHelpers';
import { useAdvisorChat } from './useAdvisorChat';
import { useAdvisorOverview, useAdvisorRecommendations } from './useAdvisor';
import { useDismissRecommendation, useMarkRecommendationReviewed } from './useAdvisorMutations';

function NewChatButton({ onPress, label }: { onPress: () => void; label: string }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID="advisor-new-chat"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: tokens.spacing.xs,
        paddingVertical: tokens.spacing.xs,
        paddingHorizontal: tokens.spacing.sm,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color.primarySoft,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="add" size={16} color={tokens.color.primary} />
      <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AdvisorScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  const overviewQuery = useAdvisorOverview();
  const recommendationsQuery = useAdvisorRecommendations();
  const chat = useAdvisorChat();
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

          <Card
            title={t('advisor.chat.title')}
            headerAction={
              <NewChatButton onPress={chat.newChat} label={t('advisor.chat.newChat')} />
            }
          >
            <Text variant="caption" tone="muted">
              {t('advisor.prompts.title')}
            </Text>
            <PromptSuggestions
              prompts={overviewQuery.data.prompts}
              disabled={chat.sending}
              onSelect={(text) => chat.send(text)}
            />
            <View style={{ marginTop: tokens.spacing.md }}>
              <ConversationPanel
                messages={chat.messages}
                sending={chat.sending}
                onSend={(text) => chat.send(text)}
              />
            </View>
          </Card>

          <Card title={t('advisor.history.title')}>
            <ChatHistoryPanel sessions={chat.history} onOpen={chat.openSession} />
          </Card>

          <StoreContextCard context={overviewQuery.data.context} />

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
