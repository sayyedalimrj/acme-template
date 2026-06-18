/**
 * Support request detail / review.
 *
 * Internal review surface for one queue item: summary + store info, status timeline,
 * playbook checklist, internal notes, next action, and a security/handoff warning. Allows
 * MOCK-ONLY, in-memory staff actions — change status (from a safe predefined list), assign a
 * teammate, toggle checklist items, and add an internal note. No backend, no real
 * notification, no provisioning, no connection (see security-model.md).
 */
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { Badge, Card, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { ChoiceGroup } from '@/features/onboarding/components/ChoiceGroup';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { StatusTimeline } from '@/features/onboarding/components/StatusTimeline';
import { useT } from '@/i18n/I18nProvider';
import { supportAssignees } from '@/mock/data/supportQueue';
import { useTheme } from '@/theme';

import { SupportChecklist } from './components/SupportChecklist';
import { SupportNotes } from './components/SupportNotes';
import {
  ownerLabelKey,
  priorityMeta,
  riskMeta,
  statusMeta,
  statusOptionsForType,
  typeLabelKey,
} from './supportHelpers';
import { useSupportRequest } from './useSupport';
import {
  useAddInternalNote,
  useAssignSupportRequest,
  useToggleChecklistItem,
  useUpdateSupportStatus,
} from './useSupportMutations';

function DetailRow({ label, value }: { label: string; value: ReactNode }): React.JSX.Element {
  const { tokens, rowDirection, isRTL } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        paddingVertical: tokens.spacing.xs,
      }}
    >
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="label" style={{ flexShrink: 1, textAlign: isRTL ? 'left' : 'right' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export interface SupportRequestDetailScreenProps {
  requestId: string;
}

export function SupportRequestDetailScreen({
  requestId,
}: SupportRequestDetailScreenProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();

  const { data: item, isPending, isError, refetch } = useSupportRequest(requestId);
  const statusMutation = useUpdateSupportStatus(requestId);
  const assignMutation = useAssignSupportRequest(requestId);
  const checklistMutation = useToggleChecklistItem(requestId);
  const noteMutation = useAddInternalNote(requestId);

  if (isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (isError || !item) {
    return (
      <Screen testID="support-detail-screen" title={t('support.detail.notFound.title')}>
        <ErrorState
          title={t('support.detail.notFound.title')}
          body={t('support.detail.notFound.body')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  const status = statusMeta(item.status);
  const priority = priorityMeta(item.priority);
  const typeLabel = t(typeLabelKey(item.type));
  const busy =
    statusMutation.isPending ||
    assignMutation.isPending ||
    checklistMutation.isPending ||
    noteMutation.isPending;

  const assigneeValue = item.assignee?.id ?? 'none';
  const assigneeChoices = [
    { value: 'none', label: t('support.action.unassign') },
    ...supportAssignees.map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <Screen testID="support-detail-screen" title={item.storeName}>
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
        <Badge tone="neutral" label={typeLabel} />
        <Badge tone={status.tone} label={t(status.labelKey)} />
        <Badge tone={priority.tone} label={t(priority.labelKey)} />
      </View>

      {/* Store information */}
      <Card title={t('support.detail.storeInfo')}>
        <DetailRow label={t('support.detail.type')} value={typeLabel} />
        {item.siteUrl ? (
          <DetailRow label={t('support.detail.siteUrl')} value={item.siteUrl} />
        ) : null}
        {item.domain ? <DetailRow label={t('support.detail.domain')} value={item.domain} /> : null}
        {item.templateName ? (
          <DetailRow label={t('support.detail.template')} value={item.templateName} />
        ) : null}
        {item.planName ? (
          <DetailRow label={t('support.detail.plan')} value={item.planName} />
        ) : null}
        <DetailRow
          label={t('support.detail.assignee')}
          value={item.assignee ? item.assignee.name : t('support.row.unassigned')}
        />
        <DetailRow
          label={t('support.detail.nextAction')}
          value={
            <View
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: tokens.spacing.xs,
                flexShrink: 1,
              }}
            >
              <Badge tone="info" label={t(ownerLabelKey(item.nextAction.owner))} />
              <Text variant="label" style={{ flexShrink: 1 }}>
                {item.nextAction.summary}
              </Text>
            </View>
          }
        />
        {item.risks.length > 0 ? (
          <View style={{ paddingTop: tokens.spacing.xs, gap: tokens.spacing.xs }}>
            <Text variant="label" tone="muted">
              {t('support.detail.risks')}
            </Text>
            <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
              {item.risks.map((risk) => {
                const meta = riskMeta(risk);
                return <Badge key={risk} tone={meta.tone} label={t(meta.labelKey)} />;
              })}
            </View>
          </View>
        ) : null}
      </Card>

      {/* Mock staff actions */}
      <Card title={t('support.action.changeStatus')}>
        <ChoiceGroup
          value={item.status}
          disabled={busy}
          onChange={(next) => statusMutation.mutate(next)}
          choices={statusOptionsForType(item.type).map((s) => ({
            value: s,
            label: t(statusMeta(s).labelKey),
          }))}
        />
        <Text variant="label" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
          {t('support.action.assign')}
        </Text>
        <ChoiceGroup
          value={assigneeValue}
          disabled={busy}
          onChange={(value) => assignMutation.mutate(value === 'none' ? null : value)}
          choices={assigneeChoices}
        />
      </Card>

      {/* Timeline */}
      <Card title={t('support.detail.timeline')}>
        <StatusTimeline events={item.timeline} testID="support-timeline" />
      </Card>

      {/* Playbook checklist */}
      <Card title={t('support.detail.checklist')}>
        <SupportChecklist
          items={item.checklist}
          disabled={busy}
          onToggle={(checklistItemId) => checklistMutation.mutate(checklistItemId)}
        />
      </Card>

      {/* Internal notes */}
      <Card title={t('support.detail.notes')}>
        <SupportNotes
          notes={item.notes}
          saving={noteMutation.isPending}
          onAdd={(body) => noteMutation.mutate(body)}
        />
      </Card>

      <SecurityNote messageKey="support.security.note" />
    </Screen>
  );
}
