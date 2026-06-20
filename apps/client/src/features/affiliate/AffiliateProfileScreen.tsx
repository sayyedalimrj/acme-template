/**
 * AffiliateProfileScreen — the marketer's profile + referral materials ("/affiliate/profile").
 *
 * Shows the referral code/link, tier, commission rate, and ready-to-share marketing copy.
 */
import React from 'react';
import { View } from 'react-native';

import { PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Text } from '@/components/ui';
import { MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics, mobileType, useMobileColors } from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';

import { useAffiliateProfile } from '@/services/affiliateApi';

export function AffiliateProfileScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const { isRTL } = useTheme();
  const { data: profile } = useAffiliateProfile();
  const shareMessage = `با کد معرفی من فروشگاه اینترنتی‌ت رو راه بنداز و مدیریت کن: ${profile.referralLink}`;

  return (
    <MobilePage testID="affiliate-profile-screen" header={<MobileTabHeader title="پروفایل بازاریاب" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="هویت معرفی" />
          <PortalRowCard icon="pricetag-outline" title="کد معرفی" meta={profile.code} />
          <PortalRowCard icon="ribbon-outline" title="سطح" meta={profile.tierLabel} />
          <PortalRowCard icon="cash-outline" title="نرخ پورسانت" meta={profile.commissionRateLabel} />
        </View>

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="لینک معرفی" />
          <View
            style={{
              backgroundColor: colors.tile,
              borderRadius: mobileMetrics.cardRadiusSmall,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: mobileType.captionSize, color: colors.text, writingDirection: 'ltr', textAlign: 'left' }}>
              {profile.referralLink}
            </Text>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="متن آماده اشتراک‌گذاری" />
          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: mobileMetrics.cardRadiusSmall,
              padding: 14,
            }}
          >
            <Text
              style={{
                fontSize: mobileType.bodySize,
                color: colors.text,
                lineHeight: 24,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {shareMessage}
            </Text>
          </View>
        </View>
      </View>
    </MobilePage>
  );
}
