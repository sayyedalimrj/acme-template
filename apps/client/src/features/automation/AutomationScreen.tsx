/**
 * SMS & Back-in-stock automation (index) — simplified, mock-only.
 *
 * Pared back to the essentials a merchant cares about: a one-line provider status, who is
 * waiting for a back-in-stock alert, and review-only message drafts. The busy
 * provider/consent readiness matrix, conversion-readiness/budget badges, audience-size and
 * char-count chips, and the rules table were removed to reduce clutter.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real SMS/email/WhatsApp provider, no messages sent, no real
 * phone numbers/sender IDs/keys, no scheduler. Sending is disabled; consent + opt-out are
 * required before any future real send (see security-model.md).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  MockActionButton,
  Screen,
  StatusBadge,
  Surface,
  Text,
} from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import {
  actionStatusMeta,
  buildMessagePreview,
  channelLabelKey,
  providerStatusMeta,
} from './automationHelpers';
import { useAutomationOverview, useCampaignDrafts } from './useAutomation';
import {
  useApproveDraft,
  useCreateBackInStockDraft,
  useDismissDraft,
  useMarkDraftReviewed,
} from './useAutomationMutations';

export function AutomationScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();

  const overviewQuery = useAutomationOverview();
  const draftsQuery = useCampaignDrafts();
  const createDraft = useCreateBackInStockDraft();
  const markReviewed = useMarkDraftReviewed();
  const approve = useApproveDraft();
  const dismiss = useDismissDraft();

  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const drafts = draftsQuery.data ?? [];
  const draftBusy = markReviewed.isPending || approve.isPending || dismiss.isPending;
  const selectedDraft = drafts.find((d) => d.id === selectedDraftId) ?? drafts[0];
  const preview = selectedDraft ? buildMessagePreview(selectedDraft) : null;

  return (
    <Screen
      testID="automation-screen"
      title={t('automation.title')}
      subtitle={t('automation.subtitle')}
    >
      <SecurityNote messageKey="automation.safety.note" />

      {overviewQuery.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : overviewQuery.isError || !overviewQuery.data ? (
        <ErrorState
          title={t('automation.error')}
          retryLabel={t('common.retry')}
          onRetry={() => overviewQuery.refetch()}
          fill={false}
        />
      ) : (
        <>
          {/* A. One-line workflow status (replaces the readiness matrix). */}
          {(() => {
            const providerMeta = providerStatusMeta(overviewQuery.data.readiness.smsProvider);
            return (
              <Card contentStyle={{ gap: tokens.spacing.md }}>
                <View
                  style={{
                    flexDirection: rowDirection,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: tokens.spacing.md,
                  }}
                >
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      gap: tokens.spacing.md,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: tokens.radius.pill,
                        backgroundColor: tokens.color.infoSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="chatbubbles-outline" size={20} color={tokens.color.info} />
                    </View>
                    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                      <Text variant="subheading" numberOfLines={1}>
                        {t('automation.status.title')}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {t('automation.status.subtitle')}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge tone={providerMeta.tone} label={t(providerMeta.labelKey)} />
                </View>
                <MockActionButton
                  label={t('automation.status.connectCta')}
                  note={t('common.mock')}
                />
              </Card>
            );
          })()}

          {/* B. Back-in-stock subscriptions — simple list. */}
          <Card title={t('automation.subscriptionsTitle')}>
            {overviewQuery.data.subscriptions.map((sub, index) => (
              <View key={sub.id}>
                {index > 0 ? <Divider /> : null}
                <View style={{ paddingVertical: tokens.spacing.sm, gap: 6 }}>
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      gap: tokens.spacing.xs,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Text variant="label" style={{ flexShrink: 1 }}>
                      {sub.productName}
                    </Text>
                    <Badge tone="warning" label={sub.stockStatus} />
                    <Badge
                      tone="neutral"
                      label={`${sub.interestedShoppers} ${t('automation.shoppers')}`}
                    />
                  </View>
                  <Text variant="caption" tone="muted">
                    {sub.suggestedMessage}
                  </Text>
                  <View
                    style={{
                      flexDirection: rowDirection,
                      gap: tokens.spacing.sm,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      label={t('automation.action.createDraft')}
                      variant="secondary"
                      size="sm"
                      disabled={createDraft.isPending}
                      onPress={() => createDraft.mutate(sub.productId)}
                    />
                    <Button
                      label={t('automation.action.openProduct')}
                      variant="ghost"
                      size="sm"
                      onPress={() => router.navigate(`/products/${sub.productId}` as never)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card>

          {/* C. Message drafts — simple cards (no conversion/budget/audience clutter). */}
          <Card title={t('automation.draftsTitle')}>
            {draftsQuery.isPending ? (
              <LoadingState label={t('common.loading')} fill={false} />
            ) : drafts.length === 0 ? (
              <EmptyState title={t('automation.empty')} icon="chatbubbles-outline" fill={false} />
            ) : (
              <View style={{ gap: tokens.spacing.md }}>
                {drafts.map((draft) => {
                  const status = actionStatusMeta(draft.status);
                  const dismissed = draft.status === 'dismissed';
                  return (
                    <Surface
                      key={draft.id}
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
                          {draft.title}
                        </Text>
                        <Badge tone="info" label={t(channelLabelKey(draft.channel))} />
                        <Badge tone={status.tone} label={t(status.labelKey)} />
                      </View>
                      <Text variant="caption" tone="muted">
                        «{draft.messagePreview}»
                      </Text>
                      <View
                        style={{
                          flexDirection: rowDirection,
                          flexWrap: 'wrap',
                          gap: tokens.spacing.sm,
                        }}
                      >
                        <Button
                          label={t('automation.action.preview')}
                          variant="secondary"
                          size="sm"
                          onPress={() => setSelectedDraftId(draft.id)}
                        />
                        <Button
                          label={t('automation.action.markReviewed')}
                          variant="secondary"
                          size="sm"
                          disabled={draftBusy || draft.status === 'reviewed'}
                          onPress={() => markReviewed.mutate(draft.id)}
                        />
                        <Button
                          label={t('automation.action.approve')}
                          variant="primary"
                          size="sm"
                          disabled={draftBusy || draft.status === 'approved'}
                          onPress={() => approve.mutate(draft.id)}
                        />
                        <Button
                          label={t('automation.action.dismiss')}
                          variant="ghost"
                          size="sm"
                          disabled={draftBusy || dismissed}
                          onPress={() => dismiss.mutate(draft.id)}
                        />
                      </View>
                    </Surface>
                  );
                })}
              </View>
            )}
          </Card>

          {/* D. Message preview (consent-gated) — body + opt-out only. */}
          {preview ? (
            <Card title={t('automation.previewTitle')}>
              <Surface variant="surfaceAlt" bordered padding="md" style={{ gap: tokens.spacing.sm }}>
                <Badge tone="info" label={t(channelLabelKey(preview.channel))} />
                <Text variant="body">{preview.body}</Text>
                <Text variant="caption" tone="muted">
                  {preview.optOutText}
                </Text>
                <View
                  style={{
                    flexDirection: rowDirection,
                    gap: tokens.spacing.xs,
                    alignItems: 'flex-start',
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={14} color={tokens.color.warning} />
                  <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                    {preview.consentWarning}
                  </Text>
                </View>
                <Badge tone="danger" label={t('automation.sendDisabled')} />
              </Surface>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
