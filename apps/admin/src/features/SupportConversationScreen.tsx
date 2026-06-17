/**
 * Support conversation detail — message timeline + internal notes + the Customer Context
 * Panel + related workflow tasks, security signals, canned replies, a data-access policy
 * card, and disabled mock actions. "Open customer profile" / related workflow links are real
 * in-app navigation; all reply/assign/resolve/etc. actions are mock (no provider, no save).
 */
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  LoadingState,
  MockActionButton,
  Screen,
  StatusBadge,
  Text,
  type Tone,
} from '@/ui';
import type { SupportMessageAuthor } from '@/domain/types';
import { supportService, SUPPORT_DATA_ACCESS_POLICY } from '@/services/supportService';

import { CustomerContextPanel } from './CustomerContextPanel';
import {
  securityTypeLabelKey,
  severityMeta,
  supportChannelLabelKey,
  supportPriorityMeta,
  supportSlaMeta,
  supportStatusMeta,
  visibilityMeta,
  workflowStatusMeta,
} from './helpers';

const AUTHOR_TONE: Record<SupportMessageAuthor, Tone> = {
  customer: 'default',
  agent: 'primary',
  system: 'muted',
};
const AUTHOR_LABEL: Record<SupportMessageAuthor, 'support.author.customer' | 'support.author.agent' | 'support.author.system'> = {
  customer: 'support.author.customer',
  agent: 'support.author.agent',
  system: 'support.author.system',
};

export function SupportConversationScreen({
  conversationId,
}: {
  conversationId: string;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();

  const convoQ = useAsync(() => supportService.getSupportConversation(conversationId), [conversationId]);
  const repliesQ = useAsync(() => supportService.listSupportCannedReplies(), []);

  const back = () => router.navigate('/support' as Href);

  if (convoQ.loading) {
    return (
      <Screen testID="support-conversation-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (convoQ.error || !convoQ.data) {
    return (
      <Screen testID="support-conversation-screen">
        <EmptyState title={t('support.notFound.title')} body={t('support.notFound.body')} />
        <View style={{ alignItems: 'flex-start' }}>
          <Button label={t('support.detail.back')} variant="secondary" size="sm" onPress={back} />
        </View>
      </Screen>
    );
  }

  const c = convoQ.data;

  return (
    <Screen testID="support-conversation-screen">
      <View style={{ alignItems: 'flex-start' }}>
        <Button label={t('support.detail.back')} variant="ghost" size="sm" onPress={back} />
      </View>

      {/* Header */}
      <Card>
        <Text variant="subheading">{c.subject}</Text>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
          <StatusBadge tone={supportStatusMeta(c.status).tone} label={t(supportStatusMeta(c.status).labelKey)} />
          <StatusBadge tone={supportPriorityMeta(c.priority).tone} label={t(supportPriorityMeta(c.priority).labelKey)} />
          <StatusBadge tone={supportSlaMeta(c.sla).tone} label={t(supportSlaMeta(c.sla).labelKey)} dot={false} />
          <Badge tone="neutral" label={t(supportChannelLabelKey(c.channel))} />
          <Badge tone="neutral" label={c.assignee ? c.assignee.label : t('support.filter.unassigned')} />
        </View>
        {c.tags.length > 0 ? (
          <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
            {c.tags.map((tag) => (
              <Badge key={tag} tone="info" label={tag} />
            ))}
          </View>
        ) : null}
      </Card>

      {/* Customer Context Panel */}
      <CustomerContextPanel context={c.context} />

      {/* Cross-links (real in-app navigation) */}
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
        <Button
          label={t('support.action.openProfile')}
          variant="secondary"
          size="sm"
          onPress={() => router.navigate(`/customers/${c.tenantId}` as Href)}
        />
        <MockActionButton label={t('support.action.openSiteHealth')} note={t('common.mock')} />
      </View>

      {/* Messages */}
      <Card title={t('support.detail.messages')}>
        {c.messages.map((m, i) => (
          <View key={m.id}>
            {i > 0 ? <Divider /> : null}
            <View style={{ gap: 2, paddingVertical: tokens.spacing.xs }}>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
                <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
                  <Text variant="label" tone={AUTHOR_TONE[m.author]}>
                    {m.authorLabel}
                  </Text>
                  <Badge tone="neutral" label={t(AUTHOR_LABEL[m.author])} />
                </View>
                <Text variant="caption" tone="muted">
                  {fmt.date(m.at)}
                </Text>
              </View>
              <Text variant="body">{m.body}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Internal notes */}
      <Card title={t('support.detail.notes')}>
        {c.internalNotes.length === 0 ? (
          <Text tone="muted" variant="caption">
            {t('support.detail.notesPlaceholder')}
          </Text>
        ) : (
          c.internalNotes.map((n, i) => (
            <View key={n.id}>
              {i > 0 ? <Divider /> : null}
              <View style={{ gap: 2, paddingVertical: tokens.spacing.xs }}>
                <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', gap: tokens.spacing.sm }}>
                  <Text variant="caption" tone="muted">
                    {n.authorLabel}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {fmt.date(n.at)}
                  </Text>
                </View>
                <Text variant="caption">{n.body}</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Related workflow tasks (real links) */}
      {c.linkedWorkflows.length > 0 ? (
        <Card title={t('support.detail.relatedWorkflows')}>
          {c.linkedWorkflows.map((w) => (
            <View
              key={w.id}
              style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, paddingVertical: 3 }}
            >
              <Text variant="caption" style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
                {w.title}
              </Text>
              <StatusBadge tone={workflowStatusMeta(w.status).tone} label={t(workflowStatusMeta(w.status).labelKey)} />
              <Button label="↗" variant="ghost" size="sm" onPress={() => router.navigate(`/workflows/${w.id}` as Href)} />
            </View>
          ))}
        </Card>
      ) : null}

      {/* Related security/audit signals (restricted — future RBAC) */}
      {c.relatedSignals.length > 0 ? (
        <Card title={t('support.detail.relatedSignals')}>
          {c.relatedSignals.map((s) => (
            <View
              key={s.id}
              style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, paddingVertical: 3 }}
            >
              <Text variant="caption" style={{ flex: 1, minWidth: 0 }} numberOfLines={2}>
                {t(securityTypeLabelKey(s.type))}: {s.message}
              </Text>
              <StatusBadge tone={severityMeta(s.severity).tone} label={t(severityMeta(s.severity).labelKey)} />
            </View>
          ))}
        </Card>
      ) : null}

      {/* Canned replies */}
      <Card title={t('support.detail.cannedReplies')}>
        {(repliesQ.data ?? []).map((r, i) => (
          <View key={r.id}>
            {i > 0 ? <Divider /> : null}
            <View style={{ gap: 2, paddingVertical: tokens.spacing.xs }}>
              <Text variant="label">{r.title}</Text>
              <Text variant="caption" tone="muted">
                {r.body}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Data access policy (future RBAC) */}
      <Card title={t('support.policy.title')}>
        {SUPPORT_DATA_ACCESS_POLICY.map((p) => {
          const meta = visibilityMeta(p.level);
          return (
            <View
              key={p.level}
              style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, paddingVertical: 3 }}
            >
              <Text variant="caption" tone="muted" style={{ flex: 1, minWidth: 0 }} numberOfLines={2}>
                {t(meta.descKey)}
              </Text>
              <StatusBadge tone={meta.tone} label={t(meta.labelKey)} dot={false} />
            </View>
          );
        })}
        <Divider />
        <Text variant="caption" tone="muted">
          {t('support.policy.pii')} · {t('support.policy.db')}
        </Text>
      </Card>

      {/* Mock actions */}
      <Card>
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
          <MockActionButton label={t('support.action.reply')} note={t('common.mock')} />
          <MockActionButton label={t('support.action.assign')} note={t('common.mock')} />
          <MockActionButton label={t('support.action.addNote')} note={t('common.mock')} />
          <MockActionButton label={t('support.action.resolve')} note={t('common.mock')} />
          <MockActionButton label={t('support.action.createWorkflow')} note={t('common.mock')} />
          <MockActionButton label={t('support.action.escalate')} note={t('common.mock')} />
        </View>
      </Card>
    </Screen>
  );
}
