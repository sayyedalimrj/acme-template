/**
 * AdminMoreScreen — secondary admin tools, portal switcher, and sign out ("/admin/more").
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalSectionTitle } from '@/components/portal/PortalUI';
import { Button } from '@/components/ui';
import { AnimatedSection, FeatureCard, MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { useSession } from '@/session/SessionProvider';

export function AdminMoreScreen(): React.JSX.Element {
  const router = useRouter();
  const { signOut } = useSession();
  const go = (href: string): void => router.navigate(href as never);

  const tools: { key: string; icon: React.ComponentProps<typeof FeatureCard>['icon']; label: string; href: string }[] = [
    { key: 'merchants', icon: 'storefront-outline', label: 'فروشندگان', href: '/admin/merchants' },
    { key: 'marketers', icon: 'megaphone-outline', label: 'بازاریاب‌ها', href: '/admin/marketers' },
    { key: 'payouts', icon: 'cash-outline', label: 'تسویه پورسانت', href: '/admin/payouts' },
    { key: 'settings', icon: 'settings-outline', label: 'تنظیمات', href: '/admin/settings' },
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
          <Button label="خروج از حساب" variant="secondary" onPress={() => void signOut()} testID="admin-sign-out" />
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
