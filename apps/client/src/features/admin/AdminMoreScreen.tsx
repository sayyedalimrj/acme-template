/**
 * AdminMoreScreen — secondary admin tools, portal switcher, and sign out ("/admin/more").
 */
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Button } from '@/components/ui';
import { AnimatedSection, FeatureCard, MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { useSession } from '@/session/SessionProvider';

export function AdminMoreScreen(): React.JSX.Element {
  const router = useRouter();
  const { signOut, setPortal } = useSession();
  const go = (href: string): void => router.navigate(href as never);

  const switchTo = (portal: 'merchant' | 'affiliate', href: string): void => {
    setPortal(portal);
    router.replace(href as Href);
  };

  const tools: { key: string; icon: React.ComponentProps<typeof FeatureCard>['icon']; label: string; href: string }[] = [
    { key: 'marketers', icon: 'megaphone-outline', label: 'بازاریاب‌ها', href: '/admin/marketers' },
    { key: 'payouts', icon: 'cash-outline', label: 'تسویه پورسانت', href: '/admin/payouts' },
    { key: 'support', icon: 'chatbubble-ellipses-outline', label: 'پشتیبانی', href: '/support' },
    { key: 'plans', icon: 'pricetag-outline', label: 'پلن‌ها', href: '/plans' },
  ];

  return (
    <MobilePage testID="admin-more-screen" header={<MobileTabHeader title="بیشتر" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <AnimatedSection index={0}>
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="ابزارهای مدیریت" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {tools.map((tool) => (
                <View key={tool.key} style={{ width: '47.5%', flexGrow: 1 }}>
                  <FeatureCard
                    icon={tool.icon}
                    label={tool.label}
                    onPress={() => go(tool.href)}
                    testID={`admin-tool-${tool.key}`}
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
              testID="admin-switch-merchant"
            />
            <PortalRowCard
              icon="megaphone-outline"
              title="پنل بازاریاب"
              subtitle="معرفی فروشنده و پورسانت"
              onPress={() => switchTo('affiliate', '/affiliate')}
              testID="admin-switch-affiliate"
            />
          </View>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <Button label="خروج از حساب" variant="secondary" onPress={() => void signOut()} testID="admin-sign-out" />
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
