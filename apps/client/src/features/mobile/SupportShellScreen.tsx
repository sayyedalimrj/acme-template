/**
 * SupportShellScreen — customer support entry (shell).
 *
 * A calm support landing: a reassuring intro, a primary "chat with support" CTA and a "new
 * request" action, plus a recent-messages preview. This is a shell only — no real chat backend,
 * no provider. The full conversation flow is a later PR. Customer-friendly copy only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import {
  AnimatedSection,
  MiniActivityRow,
  MobilePage,
  MobileSubHeader,
  PressableScale,
} from './components';
import { SUPPORT_PREVIEW } from './mobileMockData';
import { mobileColors, mobileMetrics, mobileShadow, mobileType } from './mobileTokens';

export function SupportShellScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { rowDirection, isRTL } = useTheme();
  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/' as never);
    }
  };

  return (
    <MobilePage
      testID="support-screen"
      header={
        <MobileSubHeader title={t('csupport.title')} onBack={onBack} backLabel={t('mobile.back')} />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 22 }}>
        <AnimatedSection index={0}>
          <View
            style={[
              {
                borderRadius: mobileMetrics.cardRadius,
                backgroundColor: mobileColors.hero,
                padding: 20,
                gap: 16,
              },
              mobileShadow,
            ]}
          >
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: mobileColors.heroLayer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="headset-outline" size={24} color={mobileColors.heroText} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: mobileType.bodySize,
                  color: mobileColors.heroTextSoft,
                  textAlign: isRTL ? 'right' : 'left',
                  lineHeight: 22,
                }}
              >
                {t('csupport.subtitle')}
              </Text>
            </View>

            <PressableScale
              onPress={() => router.navigate('/support' as never)}
              accessibilityLabel={t('csupport.chat')}
              testID="support-chat"
              style={{
                height: mobileMetrics.tapTargetMin,
                borderRadius: 10,
                backgroundColor: mobileColors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: mobileColors.onPrimary, fontWeight: '700', fontSize: 15 }}>
                {t('csupport.chat')}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={() => router.navigate('/support' as never)}
              accessibilityLabel={t('csupport.newRequest')}
              testID="support-new-request"
              style={{
                height: 44,
                borderRadius: 10,
                backgroundColor: mobileColors.heroLayer,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: mobileColors.heroText, fontWeight: '700', fontSize: 14 }}>
                {t('csupport.newRequest')}
              </Text>
            </PressableScale>
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <Text
            style={{
              fontSize: mobileType.sectionSize,
              fontWeight: '700',
              color: mobileColors.text,
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: 12,
            }}
          >
            {t('csupport.recent')}
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
            {SUPPORT_PREVIEW.map((item) => (
              <MiniActivityRow
                key={item.id}
                icon="chatbubble-ellipses-outline"
                tint="primary"
                title={t(item.titleKey)}
                caption={t(item.captionKey)}
                unread={item.unread}
                testID={`support-preview-${item.id}`}
              />
            ))}
          </View>
          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: mobileColors.textSecondary,
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            {t('csupport.mockNote')}
          </Text>
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
