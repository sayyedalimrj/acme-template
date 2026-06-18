/**
 * MobileComingSoonScreen — a beautiful, calm "coming soon" page for the mobile app.
 *
 * Used for routes that are intentionally not built yet (e.g. customer Payments) so they never
 * look broken or show a "Route Not Found". A soft icon tile, a short title and subtitle, and a
 * back header. Customer-friendly copy only. Mock-only; no backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

import { AnimatedSection, AppCard, MobilePage, MobileSubHeader } from './components';
import { mobileColors, mobileMetrics, mobileType } from './mobileTokens';

export interface MobileComingSoonScreenProps {
  /** Header + card title. */
  title: string;
  /** Short explanatory subtitle. */
  subtitle: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  testID?: string;
  /** Optional small "coming soon" pill text under the subtitle. */
  badge?: string;
}

export function MobileComingSoonScreen({
  title,
  subtitle,
  icon = 'sparkles-outline',
  testID = 'coming-soon-screen',
  badge,
}: MobileComingSoonScreenProps): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/' as never);
    }
  };

  return (
    <MobilePage
      testID={testID}
      header={<MobileSubHeader title={title} onBack={onBack} backLabel={t('mobile.back')} />}
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, paddingTop: 12 }}>
        <AnimatedSection index={0}>
          <AppCard padding={24}>
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 28,
                  backgroundColor: mobileColors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={icon} size={38} color={mobileColors.primary} />
              </View>
              <Text
                style={{
                  fontSize: mobileType.sectionSize,
                  fontWeight: '700',
                  color: mobileColors.text,
                  textAlign: 'center',
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: mobileType.bodySize,
                  color: mobileColors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 23,
                }}
              >
                {subtitle}
              </Text>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: mobileColors.tile,
                }}
              >
                <Text
                  style={{
                    fontSize: mobileType.captionSize,
                    fontWeight: '700',
                    color: mobileColors.textSecondary,
                  }}
                >
                  {badge ?? t('mock.comingSoonActive')}
                </Text>
              </View>
            </View>
          </AppCard>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
