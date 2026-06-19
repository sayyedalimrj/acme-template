/**
 * AffiliateHomeScreen — the marketer overview ("/affiliate").
 *
 * Earnings summary, the shareable referral link/code, quick actions, and recent commissions.
 * Mock data only; reuses the shared design system.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Text } from '@/components/ui';
import { AnimatedSection, MobilePage, QuickActionCard } from '@/features/mobile/components';
import { mobileMetrics, mobileType, useMobileColors } from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';

import {
  useAffiliateCommissions,
  useAffiliateOverview,
  useAffiliateProfile,
} from '@/services/affiliateApi';
import type { AffiliateProfile } from '@/domain/affiliate';
import { commissionStatusMeta } from './affiliateFormat';

/** The referral-link card: shows the marketer's code + link with a (mock) copy/share action. */
function ReferralLinkCard({ profile }: { profile: AffiliateProfile }): React.JSX.Element {
  const colors = useMobileColors();
  const { isRTL } = useTheme();
  return (
    <View
      style={{
        borderRadius: mobileMetrics.cardRadius,
        backgroundColor: colors.hero,
        padding: 18,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: mobileType.captionSize, color: colors.heroTextSoft, textAlign: isRTL ? 'right' : 'left' }}>
        کد معرفی شما
      </Text>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.heroText, textAlign: isRTL ? 'right' : 'left' }}>
        {profile.code}
      </Text>
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.heroLayer,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Ionicons name="link-outline" size={16} color={colors.heroTextSoft} />
        <Text
          style={{ flex: 1, fontSize: mobileType.captionSize, color: colors.heroText, writingDirection: 'ltr', textAlign: 'left' }}
          numberOfLines={1}
        >
          {profile.referralLink}
        </Text>
      </View>
      <Text style={{ fontSize: mobileType.captionSize, color: colors.heroTextSoft, textAlign: isRTL ? 'right' : 'left' }}>
        نرخ پورسانت شما: {profile.commissionRateLabel} • سطح {profile.tierLabel}
      </Text>
    </View>
  );
}

export function AffiliateHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const go = (href: string): void => router.navigate(href as never);
  const { data: o } = useAffiliateOverview();
  const { data: profile } = useAffiliateProfile();
  const { data: commissions } = useAffiliateCommissions();
  const recent = commissions.slice(0, 4);

  return (
    <MobilePage testID="affiliate-home-screen">
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <AnimatedSection index={0}>
          <ReferralLinkCard profile={profile} />
        </AnimatedSection>

        <AnimatedSection index={1}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="درآمد شما" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ width: '47.5%', flexGrow: 1 }}>
                <PortalMetricTile label="کل درآمد" value={o.totalEarnedLabel} tone="success" />
              </View>
              <View style={{ width: '47.5%', flexGrow: 1 }}>
                <PortalMetricTile label="این ماه" value={o.thisMonthLabel} tone="info" />
              </View>
              <View style={{ width: '47.5%', flexGrow: 1 }}>
                <PortalMetricTile label="در انتظار" value={o.pendingLabel} tone="warning" />
              </View>
              <View style={{ width: '47.5%', flexGrow: 1 }}>
                <PortalMetricTile label="قابل برداشت" value={o.availableLabel} />
              </View>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <QuickActionCard
                icon="people"
                label="معرفی‌ها"
                count={o.referralsActive}
                onPress={() => go('/affiliate/referrals')}
                testID="affiliate-qa-referrals"
              />
            </View>
            <View style={{ flex: 1 }}>
              <QuickActionCard
                icon="cash"
                label="درآمد"
                onPress={() => go('/affiliate/earnings')}
                testID="affiliate-qa-earnings"
              />
            </View>
            <View style={{ flex: 1 }}>
              <QuickActionCard
                icon="wallet"
                label="تسویه"
                onPress={() => go('/affiliate/payouts')}
                testID="affiliate-qa-payouts"
              />
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={3}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle
              title="پورسانت‌های اخیر"
              actionLabel="همه"
              onPressAction={() => go('/affiliate/earnings')}
            />
            <View style={{ gap: 10 }}>
              {recent.map((c) => (
                <PortalRowCard
                  key={c.id}
                  icon="cash-outline"
                  title={c.referralStoreName}
                  subtitle={`${c.periodLabel} • ${c.rateLabel}`}
                  meta={c.amountLabel}
                  badge={commissionStatusMeta(c.status)}
                />
              ))}
            </View>
          </View>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
