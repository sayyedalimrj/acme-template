/**
 * AdminMarketersScreen — the marketer / affiliate network ("/admin/marketers").
 *
 * Shows each marketer with their referral code, referral counts, commission rate, and pending
 * vs. paid commission. Mock data only.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { AnimatedSection, MobilePage, MobileTabHeader, siteInitials } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';

import { ADMIN_MARKETERS } from './adminMockData';
import { marketerStatusMeta } from './adminFormat';

export function AdminMarketersScreen(): React.JSX.Element {
  const router = useRouter();
  const totalReferrals = ADMIN_MARKETERS.reduce((sum, m) => sum + m.referralsTotal, 0);
  const activeReferrals = ADMIN_MARKETERS.reduce((sum, m) => sum + m.activeReferrals, 0);

  return (
    <MobilePage testID="admin-marketers-screen" header={<MobileTabHeader title="بازاریاب‌ها" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <AnimatedSection index={0}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <PortalMetricTile label="بازاریاب‌ها" value={String(ADMIN_MARKETERS.length)} tone="info" />
            <PortalMetricTile label="کل معرفی‌ها" value={String(totalReferrals)} />
            <PortalMetricTile label="فعال" value={String(activeReferrals)} tone="success" />
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle
              title="لیست بازاریاب‌ها"
              actionLabel="تسویه‌ها"
              onPressAction={() => router.navigate('/admin/payouts' as never)}
            />
            <View style={{ gap: 10 }}>
              {ADMIN_MARKETERS.map((m) => (
                <PortalRowCard
                  key={m.id}
                  initials={siteInitials(m.name)}
                  title={`${m.name} • ${m.code}`}
                  subtitle={`${m.activeReferrals} فعال از ${m.referralsTotal} • پورسانت ${m.commissionRateLabel}`}
                  meta={m.commissionPendingLabel}
                  metaSub="در انتظار"
                  badge={marketerStatusMeta(m.status)}
                  testID={`admin-marketer-${m.id}`}
                />
              ))}
            </View>
          </View>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
