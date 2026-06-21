/**
 * MerchantSupportTicketsScreen — the merchant's REAL support inbox ("/support/tickets").
 *
 * Backed by our backend (not mock): lists the merchant's own tickets newest-first with a truthful
 * unread indicator, and lets them open a thread or file a new ticket (subject + message). Support
 * is a live feature, so in the mock/demo build it shows an honest "available in the live app" note.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Screen, Text } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import { useT } from '@/i18n/I18nProvider';
import {
  createSupportTicket,
  listMerchantTickets,
  type SupportStatus,
  type SupportTicketDTO,
} from '@/services/supportApi';
import { useTheme } from '@/theme';

const STATUS_BADGE: Record<SupportStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  open: { label: 'باز', tone: 'warning' },
  in_progress: { label: 'در حال بررسی', tone: 'success' },
  closed: { label: 'بسته', tone: 'neutral' },
};

export function MerchantSupportTicketsScreen(): React.JSX.Element {
  const { tokens, rowDirection, isRTL, shadow } = useTheme();
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const live = isApiConfigured();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['merchant', 'support', 'tickets'],
    queryFn: listMerchantTickets,
    enabled: live,
    refetchInterval: live ? 20000 : false,
  });

  const createTicket = useMutation({
    mutationFn: () => createSupportTicket({ subject: subject.trim(), body: body.trim() }),
    onSuccess: async (res) => {
      setSubject('');
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['merchant', 'support', 'tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['merchant', 'support', 'unread'] });
      router.navigate(`/support/tickets/${res.ticket.id}` as never);
    },
  });

  if (!live) {
    return (
      <Screen testID="merchant-support-tickets-screen" title="تیکت‌های پشتیبانی">
        <EmptyState
          title="در دسترس در نسخه زنده"
          body="ثبت و پیگیری تیکت پشتیبانی پس از اتصال به سرور در دسترس است."
          icon="chatbubbles-outline"
          fill={false}
        />
      </Screen>
    );
  }

  const tickets = ticketsQuery.data?.tickets ?? [];
  const canSubmit = subject.trim().length > 0 && body.trim().length > 0 && !createTicket.isPending;

  return (
    <Screen testID="merchant-support-tickets-screen" title="تیکت‌های پشتیبانی">
      <Card title="تیکت جدید">
        <Input
          testID="support-new-subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="موضوع"
        />
        <Input
          testID="support-new-body"
          value={body}
          onChangeText={setBody}
          placeholder="پیام خود را بنویسید…"
          multiline
          style={{ minHeight: 96 }}
        />
        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
          <Button
            testID="support-new-submit"
            label="ارسال تیکت"
            onPress={() => {
              if (canSubmit) createTicket.mutate();
            }}
            loading={createTicket.isPending}
            disabled={!canSubmit}
          />
        </View>
      </Card>

      {ticketsQuery.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : ticketsQuery.isError ? (
        <ErrorState
          title="بارگذاری تیکت‌ها ممکن نشد"
          retryLabel={t('common.retry')}
          onRetry={() => ticketsQuery.refetch()}
          fill={false}
        />
      ) : tickets.length === 0 ? (
        <EmptyState title="تیکتی ندارید" body="برای شروع گفتگو با پشتیبانی، تیکت جدیدی ثبت کنید." fill={false} />
      ) : (
        <View style={{ gap: tokens.spacing.sm }}>
          {tickets.map((tk: SupportTicketDTO) => (
            <Pressable
              key={tk.id}
              testID={`support-ticket-${tk.id}`}
              accessibilityRole="button"
              accessibilityLabel={tk.subject}
              onPress={() => router.navigate(`/support/tickets/${tk.id}` as never)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? tokens.color.surfaceAlt : tokens.color.surface,
                borderRadius: tokens.radius.lg,
                padding: tokens.spacing.md,
                gap: tokens.spacing.xs,
                ...shadow('sm'),
              })}
            >
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: tokens.spacing.sm,
                }}
              >
                <Text variant="subheading" numberOfLines={1} style={{ flex: 1 }}>
                  {tk.subject}
                </Text>
                <Badge tone={STATUS_BADGE[tk.status].tone} label={STATUS_BADGE[tk.status].label} />
              </View>
              {tk.merchant_unread > 0 ? (
                <Text variant="caption" tone="muted">
                  {`${tk.merchant_unread} پاسخ خوانده‌نشده`}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
