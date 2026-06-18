/**
 * QuickActionCard — one of the four primary home actions.
 *
 * Icon tile + short label + optional count badge, with press feedback. Sized per the spec
 * (~100×122). No long explanations.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

import { mobileMetrics, useMobileColors, useMobileShadow, useMobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface QuickActionCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  count?: number;
  onPress: () => void;
  testID?: string;
}

export function QuickActionCard({
  icon,
  label,
  count,
  onPress,
  testID,
}: QuickActionCardProps): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const type = useMobileType();

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      testID={testID}
      style={[
        {
          width: '100%',
          minWidth: 0,
          height: mobileMetrics.quickActionHeight,
          borderRadius: mobileMetrics.cardRadiusSmall,
          backgroundColor: colors.card,
          padding: 12,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        },
        shadow,
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={24} color={colors.primary} />
        {count && count > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              paddingHorizontal: 5,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.card,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onPrimary }}>
              {count > 99 ? '99+' : String(count)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: Math.round(type.captionSize * 0.92),
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
