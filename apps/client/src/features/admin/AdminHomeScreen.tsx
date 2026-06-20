/**
 * AdminHomeScreen — the platform admin overview ("/admin").
 *
 * KPI tiles, quick actions into the main admin areas, and a recent platform-activity feed. Mock
 * data only; RTL-safe; reuses the shared design system.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { AnimatedSection, MobilePage, QuickActionCard } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';

import { useAdminOverview } from '@/services/adminApi';

const ACTIVITY_ICON: Record<string, React.ComponentProps<typeof PortalRowCard>['icon']> = {
  merchant: 'storefront-outline',
  order: 'receipt-outline',
  marketer: 'megaphone-outline',
  payout: 'cash-outline',
  support: 'chatbubble-ellipses-outline',
  system: 'information-circle-outline',
};

export function AdminHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const go = (href: string): void => router.navigate(href as never);
  const { data: o } = useAdminOverview();

  return (
    <MobilePage testID="admin-home-screen">
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <AnimatedSection index={0}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="یک نگاه به کسب‌وکار" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {o.metrics.map((m) => (
                <View key={m.id} style={{ width: '47.5%', flexGrow: 1 }}>
                  <PortalMetricTile
                    label={m.label}
                    value={m.value}
                    changeLabel={m.changeLabel}
                    tone={m.tone ?? 'neutral'}
                  />
                </View>
              ))}
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="دسترسی سریع" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <QuickActionCard
                  icon="storefront"
                  label="فروشندگان"
                  count={o.merchantsTotal}
                  onPress={() => go('/admin/merchants')}
                  testID="admin-qa-merchants"
                />
              </View>
              <View style={{ flex: 1 }}>
                <QuickActionCard
                  icon="receipt"
                  label="سفارش‌ها"
                  onPress={() => go('/admin/orders')}
                  testID="admin-qa-orders"
                />
              </View>
              <View style={{ flex: 1 }}>
                <QuickActionCard
                  icon="megaphone"
                  label="بازاریاب‌ها"
                  onPress={() => go('/admin/marketers')}
                  testID="admin-qa-marketers"
                />
              </View>
              <View style={{ flex: 1 }}>
                <QuickActionCard
                  icon="cash"
                  label="تسویه‌ها"
                  count={o.pendingPayouts}
                  onPress={() => go('/admin/payouts')}
                  testID="admin-qa-payouts"
                />
              </View>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="فعالیت‌های اخیر" />
            <View style={{ gap: 10 }}>
              {o.recentActivity.map((a) => (
                <PortalRowCard
                  key={a.id}
                  icon={ACTIVITY_ICON[a.kind] ?? 'information-circle-outline'}
                  title={a.message}
                  subtitle={a.date}
                />
              ))}
            </View>
          </View>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
