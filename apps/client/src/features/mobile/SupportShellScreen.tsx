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
import { isApiConfigured } from '@/config/api.config';
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
import { mobileMetrics, mobileType, useMobileColors, useMobileShadow } from './mobileTokens';

export function SupportShellScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const t = useT();
  const router = useRouter();
  const { rowDirection, isRTL } = useTheme();
  const live = isApiConfigured();
  const supportHref = live ? '/support/tickets' : '/support/chat';
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
                backgroundColor: colors.hero,
                padding: 20,
                gap: 16,
              },
              shadow,
            ]}
          >
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: colors.heroLayer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="headset-outline" size={24} color={colors.heroText} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: mobileType.bodySize,
                  color: colors.heroTextSoft,
                  textAlign: isRTL ? 'right' : 'left',
                  lineHeight: 22,
                }}
              >
                {t('csupport.subtitle')}
              </Text>
            </View>

            <PressableScale
              onPress={() => router.navigate(supportHref as never)}
              accessibilityLabel={t('csupport.chat')}
              testID="support-chat"
              style={{
                height: mobileMetrics.tapTargetMin,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15 }}>
                {t('csupport.chat')}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={() => router.navigate(supportHref as never)}
              accessibilityLabel={t('csupport.newRequest')}
              testID="support-new-request"
              style={{
                height: 44,
                borderRadius: 10,
                backgroundColor: colors.heroLayer,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.heroText, fontWeight: '700', fontSize: 14 }}>
                {t('csupport.newRequest')}
              </Text>
            </PressableScale>
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          {!live ? (
            <>
              <Text
                style={{
                  fontSize: mobileType.sectionSize,
                  fontWeight: '700',
                  color: colors.text,
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
                    backgroundColor: colors.card,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                  },
                  shadow,
                ]}
              >
                {SUPPORT_PREVIEW.map((item) => (
                  <MiniActivityRow
                    key={item.id}
                    icon="chatbubble-ellipses-outline"
                    tint="primary"
                    title={t(item.titleKey)}
                    caption={t(item.captionKey)}
                    onPress={() => router.navigate('/support/chat' as never)}
                    testID={`support-preview-${item.id}`}
                  />
                ))}
              </View>
              <Text
                style={{
                  fontSize: mobileType.captionSize,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 14,
                }}
              >
                {t('csupport.chat.mockNote')}
              </Text>
            </>
          ) : null}
        </AnimatedSection>
      </View>
    </MobilePage>
  );
}
