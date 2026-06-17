/**
 * SMS & Back-in-stock automation (index) — mock-only.
 *
 * Sections: header + safety note, provider/consent readiness, back-in-stock subscriptions,
 * grouped review-only campaign drafts, a consent-gated SMS preview, and automation rules.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real SMS/email/WhatsApp provider, no Kavenegar/Twilio/
 * Klaviyo, no messages sent, no real phone numbers/sender IDs/keys, no scheduler. Sending is
 * disabled; consent + opt-out are required before any future real send (see security-model.md).
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
  Screen,
  Surface,
  Text,
} from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { NotificationReadiness } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  actionStatusMeta,
  buildMessagePreview,
  channelLabelKey,
  consentMeta,
  conversionReadinessMeta,
  groupDraftsByRuleType,
  providerStatusMeta,
  readinessMeta,
  ruleTypeLabelKey,
} from './automationHelpers';
import { useAutomationOverview, useCampaignDrafts } from './useAutomation';
import {
  useApproveDraft,
  useCreateBackInStockDraft,
  useDismissDraft,
  useMarkDraftReviewed,
} from './useAutomationMutations';

const READINESS_ROWS: { key: keyof NotificationReadiness; labelKey: StringKey }[] = [
  { key: 'smsProvider', labelKey: 'automation.readinessRow.smsProvider' },
  { key: 'kavenegar', labelKey: 'automation.readinessRow.kavenegar' },
  { key: 'twilio', labelKey: 'automation.readinessRow.twilio' },
  { key: 'email', labelKey: 'automation.readinessRow.email' },
  { key: 'consentModel', labelKey: 'automation.readinessRow.consentModel' },
  { key: 'optOutHandling', labelKey: 'automation.readinessRow.optOut' },
];

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
  const groups = groupDraftsByRuleType(drafts);
  const draftBusy = markReviewed.isPending || approve.isPending || dismiss.isPending;
  const selectedDraft = drafts.find((d) => d.id === selectedDraftId) ?? drafts[0];
  const preview = selectedDraft ? buildMessagePreview(selectedDraft) : null;

  return (
    <Screen testID="automation-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('automation.title')}</Text>
        <Text tone="muted">{t('automation.subtitle')}</Text>
      </View>

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
          {/* B. Provider / consent readiness */}
          <Card title={t('automation.readinessTitle')}>
            {READINESS_ROWS.map((row, index) => {
              const value = overviewQuery.data.readiness[row.key];
              const meta =
                row.key === 'smsProvider'
                  ? providerStatusMeta(value as 'not_connected' | 'mock')
                  : readinessMeta(value as never);
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
            <Text variant="caption" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
              {overviewQuery.data.consent.note}
            </Text>
            {overviewQuery.data.safetyNotices.map((notice) => (
              <View
                key={notice.id}
                style={{
                  flexDirection: rowDirection,
                  gap: tokens.spacing.xs,
                  alignItems: 'flex-start',
                  marginTop: tokens.spacing.xs,
                }}
              >
                <Ionicons
                  name={
                    notice.severity === 'warning' ? 'warning-outline' : 'information-circle-outline'
                  }
                  size={14}
                  color={notice.severity === 'warning' ? tokens.color.warning : tokens.color.info}
                />
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  {notice.message}
                </Text>
              </View>
            ))}
          </Card>

          {/* C. Back-in-stock subscriptions */}
          <Card title={t('automation.subscriptionsTitle')}>
            {overviewQuery.data.subscriptions.map((sub, index) => {
              const consent = consentMeta(sub.consent);
              return (
                <View key={sub.id}>
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
                        {sub.productName}
                      </Text>
                      <Badge tone="warning" label={sub.stockStatus} />
                      <Badge
                        tone="neutral"
                        label={`${sub.interestedShoppers} ${t('automation.shoppers')}`}
                      />
                      <Badge tone={consent.tone} label={t(consent.labelKey)} />
                    </View>
                    <Text variant="caption" tone="muted">
                      {sub.sku} · {t('automation.maskedExample')}: {sub.maskedExample}
                    </Text>
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
              );
            })}
          </Card>

          {/* E. SMS preview (consent-gated) */}
          {preview ? (
            <Card title={t('automation.previewTitle')}>
              <Surface
                variant="surfaceAlt"
                bordered
                padding="md"
                style={{ gap: tokens.spacing.xs }}
              >
                <View
                  style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}
                >
                  <Badge tone="info" label={t(channelLabelKey(preview.channel))} />
                  <Badge tone="neutral" label={`${preview.charCount} ${t('automation.chars')}`} />
                  <Badge
                    tone="neutral"
                    label={`${preview.audienceSize} ${t('automation.recipients')}`}
                  />
                </View>
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
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color={tokens.color.warning}
                  />
                  <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                    {preview.consentWarning}
                  </Text>
                </View>
                <Badge tone="danger" label={t('automation.sendDisabled')} />
              </Surface>
            </Card>
          ) : null}

          {/* D. Campaign drafts */}
          <Card title={t('automation.draftsTitle')}>
            {draftsQuery.isPending ? (
              <LoadingState label={t('common.loading')} fill={false} />
            ) : groups.length === 0 ? (
              <EmptyState title={t('automation.empty')} icon="chatbubbles-outline" fill={false} />
            ) : (
              <View style={{ gap: tokens.spacing.lg }}>
                {groups.map((group) => (
                  <View key={group.ruleType} style={{ gap: tokens.spacing.sm }}>
                    <Text variant="subheading">{t(ruleTypeLabelKey(group.ruleType))}</Text>
                    {group.drafts.map((draft) => {
                      const status = actionStatusMeta(draft.status);
                      const readiness = conversionReadinessMeta(draft.readiness);
                      const consent = consentMeta(draft.audience.consentReadiness);
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
                            <Badge tone={status.tone} label={t(status.labelKey)} />
                            <Badge tone={readiness.tone} label={t(readiness.labelKey)} />
                          </View>
                          <Text variant="caption" tone="muted">
                            {draft.reason}
                          </Text>
                          <View
                            style={{
                              flexDirection: rowDirection,
                              gap: tokens.spacing.xs,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Badge tone="info" label={t(channelLabelKey(draft.channel))} />
                            <Badge
                              tone="neutral"
                              label={`${draft.audience.label} · ${draft.audience.size}`}
                            />
                            <Badge tone={consent.tone} label={t(consent.labelKey)} />
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
                ))}
              </View>
            )}
          </Card>

          {/* F. Automation rules */}
          <Card title={t('automation.rulesTitle')}>
            {overviewQuery.data.rules.map((rule, index) => {
              const meta = readinessMeta(rule.status === 'mock' ? 'mock' : 'planned');
              return (
                <View key={rule.id}>
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
                        {t(ruleTypeLabelKey(rule.ruleType))}
                      </Text>
                      <Badge tone="info" label={t(channelLabelKey(rule.channel))} />
                      <Badge tone={meta.tone} label={t(meta.labelKey)} />
                    </View>
                    <Text variant="caption" tone="muted">
                      {t('automation.rule.trigger')}: {rule.trigger}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {t('automation.rule.audience')}: {rule.audience}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {rule.providerRequirement}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}
