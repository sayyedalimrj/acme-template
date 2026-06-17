/**
 * Support Inbox — internal conversation queue with KPIs, filters, a conversation list, and
 * (on wide screens) a Customer Context preview beside the list. Mock-only; no real provider,
 * no message sending. Rows open the full conversation detail.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import {
  Button,
  Card,
  DataListRow,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  Screen,
  SegmentedControl,
  StatusBadge,
  Surface,
  Text,
} from '@/ui';
import type {
  SupportChannel,
  SupportConversation,
  SupportConversationPriority,
  SupportConversationStatus,
} from '@/domain/types';
import { supportAssignees } from '@/mock/support';
import { supportService } from '@/services/supportService';

import { CustomerContextPanel } from './CustomerContextPanel';
import {
  supportChannelLabelKey,
  supportSlaMeta,
  supportStatusMeta,
} from './helpers';

type StatusFilter = 'all' | SupportConversationStatus;
type PriorityFilter = 'all' | SupportConversationPriority;
type ChannelFilter = 'all' | SupportChannel;
type AssigneeFilter = 'all' | 'unassigned' | string;

export function SupportInboxScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 980;

  const overview = useAsync(() => supportService.getSupportOverview(), []);
  const conversations = useAsync(() => supportService.listSupportConversations(), []);

  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [assignee, setAssignee] = useState<AssigneeFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = useMemo(() => conversations.data ?? [], [conversations.data]);
  const filtered = useMemo(
    () =>
      all.filter(
        (c) =>
          (status === 'all' || c.status === status) &&
          (priority === 'all' || c.priority === priority) &&
          (channel === 'all' || c.channel === channel) &&
          (assignee === 'all' ||
            (assignee === 'unassigned' ? c.assignee === null : c.assignee?.id === assignee)),
      ),
    [all, status, priority, channel, assignee],
  );

  const goDetail = (id: string) => router.navigate(`/support/${id}` as Href);
  const selected: SupportConversation | undefined =
    filtered.find((c) => c.id === selectedId) ?? filtered[0];

  if (conversations.loading) {
    return (
      <Screen testID="support-inbox-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }
  if (conversations.error) {
    return (
      <Screen testID="support-inbox-screen">
        <ErrorState title={t('common.error')} retryLabel={t('common.retry')} onRetry={conversations.reload} />
      </Screen>
    );
  }

  const k = overview.data;

  const conversationRow = (c: SupportConversation) => (
    <DataListRow
      key={c.id}
      title={`${c.subject}${c.unreadCount > 0 ? `  ·  ${fmt.num(c.unreadCount)} ${t('support.list.unread')}` : ''}`}
      subtitle={`${c.tenantName} · ${t(supportChannelLabelKey(c.channel))} · ${c.lastMessagePreview}`}
      trailing={
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <StatusBadge tone={supportStatusMeta(c.status).tone} label={t(supportStatusMeta(c.status).labelKey)} />
          <StatusBadge tone={supportSlaMeta(c.sla).tone} label={t(supportSlaMeta(c.sla).labelKey)} dot={false} />
        </View>
      }
      onPress={() => (wide ? setSelectedId(c.id) : goDetail(c.id))}
    />
  );

  const listColumn = (
    <View style={{ flex: wide ? 2 : undefined, gap: tokens.spacing.lg, minWidth: 0 }}>
      <Card title={t('support.title')}>
        <Text variant="caption" tone="muted">
          {t('support.filter.status')}
        </Text>
        <SegmentedControl<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'open', label: t('support.status.open') },
            { value: 'waiting_customer', label: t('support.status.waiting_customer') },
            { value: 'waiting_internal', label: t('support.status.waiting_internal') },
            { value: 'pending', label: t('support.status.pending') },
            { value: 'resolved', label: t('support.status.resolved') },
          ]}
        />
        <SegmentedControl<PriorityFilter>
          value={priority}
          onChange={setPriority}
          stretch
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'urgent', label: t('support.priority.urgent') },
            { value: 'high', label: t('support.priority.high') },
            { value: 'normal', label: t('support.priority.normal') },
            { value: 'low', label: t('support.priority.low') },
          ]}
        />
        <SegmentedControl<ChannelFilter>
          value={channel}
          onChange={setChannel}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'chat', label: t('support.channel.chat') },
            { value: 'email', label: t('support.channel.email') },
            { value: 'phone_note', label: t('support.channel.phone_note') },
            { value: 'whatsapp_later', label: t('support.channel.whatsapp_later') },
            { value: 'system_note', label: t('support.channel.system_note') },
          ]}
        />
        <SegmentedControl<AssigneeFilter>
          value={assignee}
          onChange={setAssignee}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'unassigned', label: t('support.filter.unassigned') },
            ...supportAssignees.map((a) => ({ value: a.id, label: a.label })),
          ]}
        />
      </Card>

      <Card title={t('support.title')} headerAction={<Text variant="caption" tone="muted">{fmt.num(filtered.length)}</Text>}>
        {filtered.length === 0 ? <EmptyState title={t('support.empty')} /> : filtered.map(conversationRow)}
      </Card>
    </View>
  );

  return (
    <Screen testID="support-inbox-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('support.title')}</Text>
        <Text tone="muted">{t('support.subtitle')}</Text>
      </View>

      <Surface bordered padding="md">
        <Text variant="caption" tone="muted">
          {t('support.security.note')}
        </Text>
      </Surface>

      {k ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
          <MetricCard label={t('support.kpi.open')} value={fmt.num(k.open)} tint="primary" />
          <MetricCard label={t('support.kpi.urgent')} value={fmt.num(k.urgent)} tint="danger" />
          <MetricCard label={t('support.kpi.overdueSla')} value={fmt.num(k.overdueSla)} tint="danger" />
          <MetricCard label={t('support.kpi.waitingCustomer')} value={fmt.num(k.waitingCustomer)} tint="warning" />
          <MetricCard label={t('support.kpi.unassigned')} value={fmt.num(k.unassigned)} tint="warning" />
          <MetricCard label={t('support.kpi.resolvedWeek')} value={fmt.num(k.resolvedThisWeek)} tint="success" />
        </View>
      ) : null}

      {wide ? (
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.lg, alignItems: 'flex-start' }}>
          {listColumn}
          <View style={{ flex: 1, gap: tokens.spacing.lg, minWidth: 0 }}>
            {selected ? (
              <>
                <CustomerContextPanel context={selected.context} compact />
                <Button label={t('support.detail.conversation')} onPress={() => goDetail(selected.id)} />
              </>
            ) : (
              <Card title={t('support.context.title')}>
                <Text tone="muted" variant="caption">
                  {t('support.context.selectHint')}
                </Text>
              </Card>
            )}
          </View>
        </View>
      ) : (
        listColumn
      )}
    </Screen>
  );
}
