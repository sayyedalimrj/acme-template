/**
 * MerchantSupportTicketScreen — one ticket's conversation for the merchant ("/support/tickets/[id]").
 *
 * Shows the real thread (merchant <-> support), lets the merchant reply, and reflects the current
 * status. Opening the thread clears the merchant's unread badge (backend marks merchant-side read).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, ErrorState, Input, LoadingState, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import {
  getMerchantTicket,
  replyMerchantTicket,
  type SupportMessageDTO,
  type SupportStatus,
} from '@/services/supportApi';
import { useTheme } from '@/theme';

const STATUS_LABEL: Record<SupportStatus, string> = {
  open: 'باز',
  in_progress: 'در حال بررسی',
  closed: 'بسته',
};

export function MerchantSupportTicketScreen({ ticketId }: { ticketId: string }): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const ticketQuery = useQuery({
    queryKey: ['merchant', 'support', 'ticket', ticketId],
    queryFn: () => getMerchantTicket(ticketId),
  });

  const sendReply = useMutation({
    mutationFn: () => replyMerchantTicket(ticketId, reply.trim()),
    onSuccess: async () => {
      setReply('');
      await queryClient.invalidateQueries({ queryKey: ['merchant', 'support', 'ticket', ticketId] });
      await queryClient.invalidateQueries({ queryKey: ['merchant', 'support', 'tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['merchant', 'support', 'unread'] });
    },
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
      <Screen testID="merchant-support-ticket-screen" title="تیکت پشتیبانی">
        <ErrorState
          title="بارگذاری تیکت ممکن نشد"
          retryLabel={t('common.retry')}
          onRetry={() => ticketQuery.refetch()}
          fill={false}
        />
      </Screen>
    );
  }

  const { ticket, messages } = ticketQuery.data;
  const closed = ticket.status === 'closed';

  return (
    <Screen testID="merchant-support-ticket-screen" title={ticket.subject} subtitle={STATUS_LABEL[ticket.status]}>
      <Card title="گفتگو">
        <View style={{ gap: tokens.spacing.sm }}>
          {messages.map((m: SupportMessageDTO) => {
            const mine = m.sender_role === 'merchant';
            return (
              <View
                key={m.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  backgroundColor: mine ? tokens.color.primarySoft : tokens.color.surfaceAlt,
                  borderRadius: tokens.radius.md,
                  padding: tokens.spacing.sm,
                }}
              >
                <Text variant="caption" tone="muted">
                  {m.sender_role === 'admin' ? 'پشتیبانی' : m.sender_role === 'system' ? 'سیستم' : 'شما'}
                </Text>
                <Text>{m.body}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {closed ? (
        <Card title="وضعیت">
          <View style={{ alignItems: 'flex-start', gap: tokens.spacing.sm }}>
            <Badge tone="neutral" label={STATUS_LABEL[ticket.status]} />
            <Text variant="caption" tone="muted">
              این تیکت بسته شده است. برای موضوع جدید، تیکت تازه‌ای ثبت کنید.
            </Text>
          </View>
        </Card>
      ) : (
        <Card title="پاسخ">
          <Input
            testID="merchant-support-reply"
            value={reply}
            onChangeText={setReply}
            placeholder="پاسخ خود را بنویسید…"
            multiline
            style={{ minHeight: 96 }}
          />
          <View style={{ marginTop: tokens.spacing.xs, alignItems: 'flex-start' }}>
            <Button
              testID="merchant-support-send"
              label="ارسال پاسخ"
              onPress={() => {
                if (reply.trim().length > 0) sendReply.mutate();
              }}
              loading={sendReply.isPending}
              disabled={reply.trim().length === 0}
            />
          </View>
        </Card>
      )}
    </Screen>
  );
}
