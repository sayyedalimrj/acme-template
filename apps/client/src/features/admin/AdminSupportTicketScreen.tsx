/**
 * AdminSupportTicketScreen — view one ticket's conversation, reply, and change status
 * ("/admin/support/[id]"). Opening the thread clears the admin unread badge (backend).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, ErrorState, Input, LoadingState, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import {
  getAdminTicket,
  replyAdminTicket,
  setAdminTicketStatus,
  type SupportMessageDTO,
  type SupportStatus,
} from '@/services/supportApi';

const STATUS_LABEL: Record<SupportStatus, string> = {
  open: 'باز',
  in_progress: 'در حال بررسی',
  closed: 'بسته',
};

export function AdminSupportTicketScreen({ ticketId }: { ticketId: string }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const ticketQuery = useQuery({
    queryKey: ['admin', 'support', 'ticket', ticketId],
    queryFn: () => getAdminTicket(ticketId),
  });

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'ticket', ticketId] });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'unread'] });
  };

  const sendReply = useMutation({
    mutationFn: () => replyAdminTicket(ticketId, reply.trim()),
    onSuccess: async () => {
      setReply('');
      await invalidate();
    },
  });
  const changeStatus = useMutation({
    mutationFn: (status: SupportStatus) => setAdminTicketStatus(ticketId, status),
    onSuccess: invalidate,
  });

  if (ticketQuery.isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }
  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <Screen testID="admin-support-ticket-screen" title="تیکت پشتیبانی">
        <ErrorState title="بارگذاری تیکت ممکن نشد" retryLabel={t('common.retry')} onRetry={() => ticketQuery.refetch()} fill={false} />
      </Screen>
    );
  }

  const { ticket, messages } = ticketQuery.data;

  return (
    <Screen testID="admin-support-ticket-screen" title={ticket.subject} subtitle={STATUS_LABEL[ticket.status]}>
      <Card title="گفتگو">
        <View style={{ gap: tokens.spacing.sm }}>
          {messages.map((m: SupportMessageDTO) => {
            const mine = m.sender_role === 'admin';
            return (
              <View
                key={m.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  backgroundColor: mine ? tokens.color.primarySoft ?? tokens.color.surfaceAlt : tokens.color.surfaceAlt,
                  borderRadius: tokens.radius.md,
                  padding: tokens.spacing.sm,
                }}
              >
                <Text variant="caption" tone="muted">
                  {m.sender_role === 'admin' ? 'پشتیبانی' : m.sender_role === 'system' ? 'سیستم' : 'فروشنده'}
                </Text>
                <Text>{m.body}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card title="پاسخ">
        <Input
          testID="admin-support-reply"
          value={reply}
          onChangeText={setReply}
          placeholder="پاسخ خود را بنویسید…"
          multiline
        />
        <View style={{ marginTop: tokens.spacing.xs, alignItems: 'flex-start' }}>
          <Button
            testID="admin-support-send"
            label="ارسال پاسخ"
            onPress={() => {
              if (reply.trim().length > 0) sendReply.mutate();
            }}
            loading={sendReply.isPending}
            disabled={reply.trim().length === 0}
          />
        </View>
      </Card>

      <Card title="وضعیت">
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
          {(['open', 'in_progress', 'closed'] as SupportStatus[]).map((s) => (
            <Button
              key={s}
              label={STATUS_LABEL[s]}
              variant={ticket.status === s ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => changeStatus.mutate(s)}
              disabled={changeStatus.isPending || ticket.status === s}
            />
          ))}
          <Badge tone={ticket.status === 'closed' ? 'neutral' : 'success'} label={STATUS_LABEL[ticket.status]} />
        </View>
      </Card>
    </Screen>
  );
}
