/**
 * Workflow detail — full view of a single internal workflow item: meta badges, customer/site,
 * owner/due, checklist, timeline, related security signals, next action, blocked reason,
 * internal-notes placeholder, future automation readiness (labels only), and disabled mock
 * actions. Unknown ids show a clean not-found state. Mock-only.
 */
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  LoadingState,
  MockActionButton,
  Screen,
  StatusBadge,
  Text,
} from '@/ui';
import { platformService } from '@/services/platformService';
import { workflowService } from '@/services/workflowService';

import {
  priorityMeta,
  readinessLabelKey,
  securityTypeLabelKey,
  severityMeta,
  slaMeta,
  workflowStatusMeta,
  workflowTypeLabelKey,
} from './helpers';

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', gap: tokens.spacing.md, paddingVertical: 3 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export function WorkflowDetailScreen({ workflowId }: { workflowId: string }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();

  const wfQ = useAsync(() => workflowService.getWorkflow(workflowId), [workflowId]);
  const signalsQ = useAsync(() => platformService.listSecuritySignals(), []);

  const back = () => router.navigate('/workflows' as Href);

  if (wfQ.loading) {
    return (
      <Screen testID="workflow-detail-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (wfQ.error || !wfQ.data) {
    return (
      <Screen testID="workflow-detail-screen">
        <EmptyState title={t('workflow.notFound.title')} body={t('workflow.notFound.body')} />
        <View style={{ alignItems: 'flex-start' }}>
          <Button label={t('workflow.detail.back')} variant="secondary" size="sm" onPress={back} />
        </View>
      </Screen>
    );
  }

  const wf = wfQ.data;
  const status = workflowStatusMeta(wf.status);
  const relatedSignals = (signalsQ.data ?? []).filter((s) => (wf.relatedSignalIds ?? []).includes(s.id));

  return (
    <Screen testID="workflow-detail-screen">
      <View style={{ alignItems: 'flex-start' }}>
        <Button label={t('workflow.detail.back')} variant="ghost" size="sm" onPress={back} />
      </View>

      <Card title={t('workflow.detail.overview')}>
        <Text variant="subheading">{wf.title}</Text>
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
          <StatusBadge tone="primary" label={t(workflowTypeLabelKey(wf.type))} dot={false} />
          <StatusBadge tone={status.tone} label={t(status.labelKey)} />
          <StatusBadge tone={priorityMeta(wf.priority).tone} label={t(priorityMeta(wf.priority).labelKey)} />
          <StatusBadge tone={slaMeta(wf.sla).tone} label={t(slaMeta(wf.sla).labelKey)} dot={false} />
        </View>
        <Divider />
        <DetailRow label={t('workflow.detail.owner')} value={wf.owner ?? t('common.none')} />
        {wf.dueAt ? <DetailRow label={t('workflow.detail.due')} value={fmt.date(wf.dueAt)} /> : null}
      </Card>

      {wf.tenantName ? (
        <Card title={t('workflow.detail.relation')}>
          <DetailRow label={t('platformAdmin.owner')} value={wf.tenantName} />
          {wf.siteName ? <DetailRow label={t('platformAdmin.site.plugin')} value={wf.siteName} /> : null}
          {wf.tenantId ? (
            <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, marginTop: tokens.spacing.xs, flexWrap: 'wrap' }}>
              <Button
                label={t('platformAdmin.viewCustomer')}
                variant="secondary"
                size="sm"
                onPress={() => router.navigate(`/customers/${wf.tenantId}` as Href)}
              />
              <Button
                label={t('support.viewConversation')}
                variant="secondary"
                size="sm"
                onPress={() => router.navigate('/support' as Href)}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card title={t('workflow.detail.nextAction')}>
        <Text>{wf.nextAction}</Text>
        {wf.blockedReason ? (
          <>
            <Divider />
            <DetailRow label={t('workflow.detail.blocked')} value={wf.blockedReason} />
          </>
        ) : null}
      </Card>

      <Card title={t('workflow.detail.checklist')}>
        {wf.checklist.length === 0 ? (
          <Text tone="muted" variant="caption">
            {t('common.none')}
          </Text>
        ) : (
          wf.checklist.map((c) => (
            <View key={c.id} style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: 2 }}>
              <Text variant="label" tone={c.done ? 'success' : 'muted'}>
                {c.done ? '☑' : '☐'}
              </Text>
              <Text variant="caption" tone={c.done ? 'muted' : 'default'} style={{ flex: 1 }}>
                {c.label}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card title={t('workflow.detail.timeline')}>
        {wf.timeline.length === 0 ? (
          <Text tone="muted" variant="caption">
            {t('common.none')}
          </Text>
        ) : (
          wf.timeline.map((e) => <DetailRow key={e.id} label={fmt.date(e.at)} value={e.label} />)
        )}
      </Card>

      {relatedSignals.length > 0 ? (
        <Card title={t('workflow.detail.signals')}>
          {relatedSignals.map((s) => (
            <View key={s.id} style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, paddingVertical: 3 }}>
              <Text variant="caption" style={{ flex: 1 }} numberOfLines={2}>
                {t(securityTypeLabelKey(s.type))}: {s.message}
              </Text>
              <StatusBadge tone={severityMeta(s.severity).tone} label={t(severityMeta(s.severity).labelKey)} />
            </View>
          ))}
        </Card>
      ) : null}

      {/* Future automation (labels only — no engine, actions disabled) */}
      <Card title={t('workflow.detail.automation')}>
        <StatusBadge tone="info" label={t(readinessLabelKey(wf.automationReadiness))} dot={false} />
        {wf.trigger ? <DetailRow label={t('workflow.detail.trigger')} value={wf.trigger} /> : null}
        {wf.condition ? <DetailRow label={t('workflow.detail.condition')} value={wf.condition} /> : null}
        {wf.action ? <DetailRow label={t('workflow.detail.action')} value={wf.action} /> : null}
      </Card>

      <Card title={t('workflow.detail.notes')}>
        <Text tone="muted" variant="caption">
          {t('workflow.detail.notesPlaceholder')}
        </Text>
      </Card>

      <Card>
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
          <MockActionButton label={t('workflow.action.moveInProgress')} note={t('common.mock')} />
          <MockActionButton label={t('workflow.action.markReviewed')} note={t('common.mock')} />
          <MockActionButton label={t('workflow.action.assignOwner')} note={t('common.mock')} />
          <MockActionButton label={t('workflow.action.contactCustomer')} note={t('common.mock')} />
          <MockActionButton label={t('workflow.action.openSupport')} note={t('common.mock')} />
          <MockActionButton label={t('workflow.action.resolve')} note={t('common.mock')} />
        </View>
      </Card>
    </Screen>
  );
}
