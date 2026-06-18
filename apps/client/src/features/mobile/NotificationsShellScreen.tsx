/**
 * NotificationsShellScreen — notifications entry (shell).
 *
 * Groups important alerts by topic (Orders / Payments / Site / Support). Read-only shell — no
 * real notification provider. Customer-friendly copy only.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { AnimatedSection, MiniActivityRow, MobilePage, MobileSubHeader } from './components';
import { NOTIFICATION_GROUPS } from './mobileMockData';
import { mobileColors, mobileMetrics, mobileShadow, mobileType } from './mobileTokens';

export function NotificationsShellScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();
  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/' as never);
    }
  };

  return (
    <MobilePage
      testID="notifications-screen"
      header={
        <MobileSubHeader title={t('notif.title')} onBack={onBack} backLabel={t('mobile.back')} />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 20 }}>
        {NOTIFICATION_GROUPS.map((group, groupIndex) => (
          <AnimatedSection key={group.key} index={groupIndex}>
            <View style={{ gap: 12 }}>
              <Text
                style={{
                  fontSize: mobileType.labelSize,
                  fontWeight: '700',
                  color: mobileColors.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t(group.titleKey)}
              </Text>
              <View
                style={[
                  {
                    borderRadius: mobileMetrics.cardRadius,
                    backgroundColor: mobileColors.card,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                  },
                  mobileShadow,
                ]}
              >
                {group.items.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? (
                      <View style={{ height: 1, backgroundColor: mobileColors.separator }} />
                    ) : null}
                    <MiniActivityRow
                      icon={item.icon}
                      tint={item.tint}
                      title={t(item.titleKey)}
                      caption={t(item.captionKey)}
                      unread={item.unread}
                      testID={`notif-${item.id}`}
                    />
                  </View>
                ))}
              </View>
            </View>
          </AnimatedSection>
        ))}
      </View>
    </MobilePage>
  );
}
