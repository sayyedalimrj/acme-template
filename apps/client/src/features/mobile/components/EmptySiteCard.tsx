/**
 * EmptySiteCard — onboarding hero shown when the merchant has no site yet.
 *
 * Replaces the hero with a calm, encouraging card: title, subtitle, a primary "set up" CTA and
 * a secondary "connect existing" CTA. Customer-friendly copy only.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

import { mobileMetrics, mobileType, useMobileColors, useMobileShadow } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface EmptySiteCardProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

export function EmptySiteCard({ onPrimary, onSecondary }: EmptySiteCardProps): React.JSX.Element {
  const t = useT();
  const colors = useMobileColors();
  const shadow = useMobileShadow();

  return (
    <View
      testID="empty-site-card"
      style={[
        {
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: colors.card,
          padding: 22,
          gap: 16,
          alignItems: 'center',
        },
        shadow,
      ]}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: colors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="storefront-outline" size={38} color={colors.primary} />
      </View>

      <View style={{ gap: 6, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: mobileType.sectionSize,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
          }}
        >
          {t('home.noSite.title')}
        </Text>
        <Text
          style={{
            fontSize: mobileType.bodySize,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          {t('home.noSite.subtitle')}
        </Text>
      </View>

      <PressableScale
        onPress={onPrimary}
        accessibilityLabel={t('home.noSite.primary')}
        testID="empty-site-primary"
        style={{
          alignSelf: 'stretch',
          height: mobileMetrics.tapTargetMin,
          borderRadius: 10,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15 }}>
          {t('home.noSite.primary')}
        </Text>
      </PressableScale>

      <PressableScale
        onPress={onSecondary}
        accessibilityLabel={t('home.noSite.secondary')}
        testID="empty-site-secondary"
        style={{ alignSelf: 'stretch', height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
          {t('home.noSite.secondary')}
        </Text>
      </PressableScale>
    </View>
  );
}
