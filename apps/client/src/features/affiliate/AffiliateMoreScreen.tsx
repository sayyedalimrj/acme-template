/**
 * AffiliateMoreScreen — marketing tools, portal switcher, and sign out ("/affiliate/more").
 */
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Button } from '@/components/ui';
import { AnimatedSection, FeatureCard, MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { useSession } from '@/session/SessionProvider';

export function AffiliateMoreScreen(): React.JSX.Element {
  const router = useRouter();
  const { signOut, setPortal } = useSession();
  const go = (href: string): void => router.navigate(href as never);

  const switchTo = (portal: 'merchant' | 'admin', href: string): void => {
    setPortal(portal);
    router.replace(href as Href);
  };

  const tools: { key: string; icon: React.ComponentProps<typeof FeatureCard>['icon']; label: string; href: string }[] = [
    { key: 'referrals', icon: 'people-outline', label: 'معرفی‌ها', href: '/affiliate/referrals' },
    { key: 'earnings', icon: 'cash-outline', label: 'درآمد', href: '/affiliate/earnings' },
    { key: 'payouts', icon: 'wallet-outline', label: 'تسویه حساب', href: '/affiliate/payouts' },
    { key: 'support', icon: 'chatbubble-ellipses-outline', label: 'پشتیبانی', href: '/support' },
  ];

  return (
    <MobilePage testID="affiliate-more-screen" header={<MobileTabHeader title="بیشتر" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <AnimatedSection index={0}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="ابزارهای بازاریابی" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {tools.map((tool) => (
                <View key={tool.key} style={{ width: '47.5%', flexGrow: 1 }}>
                  <FeatureCard
                    icon={tool.icon}
                    label={tool.label}
                    onPress={() => go(tool.href)}
                    testID={`affiliate-tool-${tool.key}`}
                  />
                </View>
              ))}
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="تغییر نسخه" />
            <PortalRowCard
              icon="storefront-outline"
              title="پنل فروشنده"
              subtitle="مدیریت یک فروشگاه"
              onPress={() => switchTo('merchant', '/')}
              testID="affiliate-switch-merchant"
            />
            <PortalRowCard
              icon="grid-outline"
              title="پنل مدیریت"
              subtitle="مدیریت کل پلتفرم"
              onPress={() => switchTo('admin', '/admin')}
              testID="affiliate-switch-admin"
            />
          </View>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <Button label="خروج از حساب" variant="secondary" onPress={() => void signOut()} testID="affiliate-sign-out" />
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
