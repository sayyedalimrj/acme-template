/**
 * AdminSupportScreen — the platform admin support inbox ("/admin/support").
 *
 * Lists every tenant's support tickets (newest first) with a status filter and a truthful unread
 * indicator (a ticket with unseen merchant messages). Tapping a ticket opens the conversation.
 * Live-only: support requires the backend, so in the mock/demo build it shows an honest notice.
 */
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { View } from 'react-native';

import { PortalRowCard } from '@/components/portal/PortalUI';
import { EmptyState } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import {
  FilterChipRow,
  MobilePage,
  MobileTabHeader,
  type FilterChipOption,
} from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { listAdminTickets, type SupportStatus } from '@/services/supportApi';

type StatusFilter = 'all' | SupportStatus;
const FILTERS: readonly FilterChipOption<StatusFilter>[] = [
  { value: 'all', label: 'همه' },
  { value: 'open', label: 'باز' },
  { value: 'in_progress', label: 'در حال بررسی' },
  { value: 'closed', label: 'بسته' },
];

const STATUS_BADGE: Record<SupportStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  open: { label: 'باز', tone: 'warning' },
  in_progress: { label: 'در حال بررسی', tone: 'success' },
  closed: { label: 'بسته', tone: 'neutral' },
};

export function AdminSupportScreen(): React.JSX.Element {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const live = isApiConfigured();

  const ticketsQuery = useQuery({
    queryKey: ['admin', 'support', 'tickets', filter],
    queryFn: () => listAdminTickets(filter === 'all' ? undefined : filter),
    enabled: live,
    refetchInterval: live ? 15000 : false,
  });
  const tickets = ticketsQuery.data?.tickets ?? [];

  return (
    <MobilePage testID="admin-support-screen" header={<MobileTabHeader title="پشتیبانی" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 14 }}>
        {!live ? (
          <EmptyState
            title="در دسترس در نسخه زنده"
            body="صندوق پشتیبانی پس از اتصال به سرور در دسترس است."
            icon="chatbubbles-outline"
            fill={false}
          />
        ) : (
          <>
            <FilterChipRow options={FILTERS} value={filter} onChange={setFilter} />
            {tickets.length === 0 ? (
              <EmptyState title="تیکتی وجود ندارد" body="هنوز پیامی از فروشندگان دریافت نشده است." fill={false} />
            ) : (
              <View style={{ gap: 10 }}>
                {tickets.map((tk) => (
                  <PortalRowCard
                    key={tk.id}
                    icon="chatbubble-ellipses-outline"
                    title={tk.subject}
                    subtitle={tk.admin_unread > 0 ? `${tk.admin_unread} پیام خوانده‌نشده` : tk.category}
                    badge={STATUS_BADGE[tk.status]}
                    testID={`admin-ticket-${tk.id}`}
                    onPress={() => router.navigate(`/admin/support/${tk.id}` as never)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </MobilePage>
  );
}
