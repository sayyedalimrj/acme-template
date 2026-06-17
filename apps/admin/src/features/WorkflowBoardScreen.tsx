/**
 * Workflow Operations board — internal ops board grouped into columns (backlog/todo, in
 * progress, waiting/blocked, review, done). KPI strip + priority/type filters + compact
 * workflow cards. No drag-and-drop, no persistence, no assignment permissions. Mock-only.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  MetricCard,
  Screen,
  SegmentedControl,
  StatusBadge,
  Surface,
  Text,
} from '@/ui';
import type { WorkflowItem, WorkflowPriority, WorkflowType } from '@/domain/types';
import { workflowService } from '@/services/workflowService';

import {
  columnForStatus,
  priorityMeta,
  slaMeta,
  workflowTypeLabelKey,
  type BoardColumnKey,
} from './helpers';

type PriorityFilter = 'all' | WorkflowPriority;
type TypeFilter = 'all' | WorkflowType;

const COLUMN_ORDER: BoardColumnKey[] = ['backlog', 'inProgress', 'waitingBlocked', 'review', 'done'];
const COLUMN_LABEL: Record<BoardColumnKey, string> = {
  backlog: 'workflow.col.backlog',
  inProgress: 'workflow.col.inProgress',
  waitingBlocked: 'workflow.col.waitingBlocked',
  review: 'workflow.col.review',
  done: 'workflow.col.done',
};
const TYPE_VALUES: WorkflowType[] = [
  'store_launch',
  'existing_site_connection',
  'template_setup',
  'support_handoff',
  'plugin_health_issue',
  'sync_review',
  'security_review',
  'billing_followup',
  'customer_success',
  'internal_task',
];

function WorkflowCard({ item, onPress }: { item: WorkflowItem; onPress: () => void }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const doneCount = item.checklist.filter((c) => c.done).length;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <Surface bordered padding="md" style={{ gap: tokens.spacing.xs }}>
        <Text variant="label" numberOfLines={2}>
          {item.title}
        </Text>
        {item.tenantName ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {item.tenantName}
            {item.siteName ? ` · ${item.siteName}` : ''}
          </Text>
        ) : null}
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
          <Badge tone="neutral" label={t(workflowTypeLabelKey(item.type))} />
          <StatusBadge tone={priorityMeta(item.priority).tone} label={t(priorityMeta(item.priority).labelKey)} />
          <StatusBadge tone={slaMeta(item.sla).tone} label={t(slaMeta(item.sla).labelKey)} dot={false} />
        </View>
        <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', gap: tokens.spacing.sm }}>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {item.owner ?? '—'}
            {item.dueAt ? ` · ${t('workflow.card.due')}: ${fmt.date(item.dueAt)}` : ''}
          </Text>
          <Text variant="caption" tone="muted">
            {t('workflow.card.checklist')}: {fmt.num(doneCount)}/{fmt.num(item.checklist.length)}
          </Text>
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {t('workflow.card.next')}: {item.nextAction}
        </Text>
      </Surface>
    </Pressable>
  );
}

export function WorkflowBoardScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();

  const itemsQ = useAsync(() => workflowService.listWorkflows(), []);
  const kpisQ = useAsync(() => workflowService.getBoardKpis(), []);
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');

  const items = useMemo(() => itemsQ.data ?? [], [itemsQ.data]);
  const filtered = useMemo(
    () =>
      items.filter(
        (w) => (priority === 'all' || w.priority === priority) && (type === 'all' || w.type === type),
      ),
    [items, priority, type],
  );

  if (itemsQ.loading) {
    return (
      <Screen testID="workflow-board-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }
  if (itemsQ.error) {
    return (
      <Screen testID="workflow-board-screen">
        <ErrorState title={t('common.error')} retryLabel={t('common.retry')} onRetry={itemsQ.reload} />
      </Screen>
    );
  }

  const k = kpisQ.data;

  return (
    <Screen testID="workflow-board-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('workflow.title')}</Text>
        <Text tone="muted">{t('workflow.subtitle')}</Text>
      </View>

      <Surface bordered padding="md">
        <Text variant="caption" tone="muted">
          {t('workflow.security.note')}
        </Text>
      </Surface>

      {k ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
          <MetricCard label={t('workflow.kpi.open')} value={fmt.num(k.open)} tint="primary" />
          <MetricCard label={t('workflow.kpi.urgent')} value={fmt.num(k.urgent)} tint="danger" />
          <MetricCard label={t('workflow.kpi.overdue')} value={fmt.num(k.overdue)} tint="danger" />
          <MetricCard label={t('workflow.kpi.blocked')} value={fmt.num(k.blocked)} tint="warning" />
          <MetricCard label={t('workflow.kpi.waitingCustomer')} value={fmt.num(k.waitingCustomer)} tint="warning" />
          <MetricCard label={t('workflow.kpi.doneWeek')} value={fmt.num(k.doneThisWeek)} tint="success" />
        </View>
      ) : null}

      <Card title={t('workflow.filter.priority')}>
        <SegmentedControl<PriorityFilter>
          value={priority}
          onChange={setPriority}
          stretch
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'urgent', label: t('platformAdmin.priority.urgent') },
            { value: 'high', label: t('platformAdmin.priority.high') },
            { value: 'medium', label: t('platformAdmin.priority.medium') },
            { value: 'low', label: t('platformAdmin.priority.low') },
          ]}
        />
        <SegmentedControl<TypeFilter>
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: t('common.all') },
            ...TYPE_VALUES.map((v) => ({ value: v, label: t(workflowTypeLabelKey(v)) })),
          ]}
        />
      </Card>

      {COLUMN_ORDER.map((col) => {
        const colItems = filtered.filter((w) => columnForStatus(w.status) === col);
        return (
          <Card
            key={col}
            title={t(COLUMN_LABEL[col])}
            headerAction={<Badge tone="neutral" label={fmt.num(colItems.length)} />}
          >
            {colItems.length === 0 ? (
              <Text tone="muted" variant="caption">
                {t('workflow.empty')}
              </Text>
            ) : (
              <View style={{ gap: tokens.spacing.sm }}>
                {colItems.map((item) => (
                  <WorkflowCard key={item.id} item={item} onPress={() => router.navigate(`/workflows/${item.id}` as Href)} />
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
