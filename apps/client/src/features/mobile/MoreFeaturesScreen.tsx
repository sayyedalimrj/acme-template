/**
 * MoreFeaturesScreen — the secondary tools page.
 *
 * A clean, touch-friendly card grid grouped into Manage / Grow sales / My site / Support.
 * Customer-friendly labels only — no technical platform terms. Mock-only navigation into the
 * existing feature routes.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { AnimatedSection, FeatureCard, MobilePage, MobileTabHeader } from './components';
import { FEATURE_SECTIONS } from './mobileMockData';
import { mobileMetrics, mobileType, useMobileColors } from './mobileTokens';

export function MoreFeaturesScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();
  const go = (href: string): void => router.navigate(href as never);
  return (
    <MobilePage
      testID="more-screen"
      header={<MobileTabHeader title={t('more.title')} />}
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 22 }}>
        {FEATURE_SECTIONS.map((section, sectionIndex) => (
          <AnimatedSection key={section.key} index={sectionIndex}>
            <View style={{ gap: 12 }}>
              <Text
                style={{
                  fontSize: mobileType.sectionSize,
                  fontWeight: '700',
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t(section.titleKey)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {section.items.map((item) => (
                  <View key={item.key} style={{ width: '47.5%', flexGrow: 1 }}>
                    <FeatureCard
                      icon={item.icon}
                      label={t(item.labelKey)}
                      badge={item.badge}
                      onPress={() => go(item.href)}
                      testID={`feature-${section.key}-${item.key}`}
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
