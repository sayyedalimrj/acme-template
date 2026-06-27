/**
 * AdminOnboardingScreen — queue of store launch / connection requests awaiting admin action.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { View } from 'react-native';

import { PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Button, Card, Input, Text } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import { MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { http } from '@/services/httpClient';

interface OnboardingRow {
  id: string;
  type: string;
  referral_code: string;
  status: string;
  payload: Record<string, unknown>;
  estimated_ready_at?: string | null;
  created_at: string;
}

async function fetchOnboarding(): Promise<OnboardingRow[]> {
  const res = await http.get<{ items: OnboardingRow[] }>('/admin/onboarding/requests?pageSize=50');
  return res.items;
}

async function deliverRequest(id: string, url: string, name: string): Promise<void> {
  await http.patch(`/admin/onboarding/requests/${id}/status`, {
    status: 'delivered',
    createSite: { name, url, mode: 'woo_rest' },
    adminNote: 'تحویل توسط پنل مدیریت',
  });
}

export function AdminOnboardingScreen(): React.JSX.Element {
  const live = isApiConfigured();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<OnboardingRow | null>(null);
  const [siteUrl, setSiteUrl] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'onboarding'],
    queryFn: fetchOnboarding,
    enabled: live,
  });

  const deliverMutation = useMutation({
    mutationFn: () =>
      deliverRequest(
        selected!.id,
        siteUrl.trim(),
        String(selected!.payload.businessName ?? 'فروشگاه'),
      ),
    onSuccess: async () => {
      setSelected(null);
      setSiteUrl('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'onboarding'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  const pending = (listQuery.data ?? []).filter((r) =>
    ['submitted', 'under_review', 'provisioning', 'ready'].includes(r.status),
  );

  return (
    <MobilePage testID="admin-onboarding-screen" header={<MobileTabHeader title="درخواست‌های فروشگاه" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        {!live ? (
          <Text tone="muted">اتصال به API برای مدیریت درخواست‌ها لازم است.</Text>
        ) : listQuery.isPending ? (
          <Text tone="muted">در حال بارگذاری…</Text>
        ) : (
          <>
            <PortalSectionTitle title={`در انتظار اقدام (${pending.length})`} />
            <View style={{ gap: 10 }}>
              {pending.length === 0 ? (
                <Text tone="muted">درخواست بازاری وجود ندارد.</Text>
              ) : (
                pending.map((row) => (
                  <PortalRowCard
                    key={row.id}
                    icon="rocket-outline"
                    title={String(row.payload.businessName ?? 'بدون نام')}
                    subtitle={`${row.type === 'new' ? 'راه‌اندازی جدید' : 'اتصال موجود'} · کد ${row.referral_code} · ${row.status}`}
                    onPress={() => {
                      setSelected(row);
                      const domain = String(row.payload.domain ?? row.payload.siteUrl ?? '');
                      setSiteUrl(domain.startsWith('http') ? domain : domain ? `https://${domain}` : '');
                    }}
                  />
                ))
              )}
            </View>
          </>
        )}

        {selected ? (
          <Card title="تحویل فروشگاه">
            <Text variant="caption" tone="muted">
              پس از آماده‌سازی، آدرس نهایی را وارد کنید و تحویل را تایید کنید. به فروشنده اعلان می‌رود.
            </Text>
            <Input
              value={siteUrl}
              onChangeText={setSiteUrl}
              placeholder="https://example.com"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label="تحویل و اتصال"
                onPress={() => deliverMutation.mutate()}
                loading={deliverMutation.isPending}
                disabled={!/^https?:\/\/.+/i.test(siteUrl.trim())}
              />
              <Button label="انصراف" variant="secondary" onPress={() => setSelected(null)} />
            </View>
          </Card>
        ) : null}
      </View>
    </MobilePage>
  );
}
