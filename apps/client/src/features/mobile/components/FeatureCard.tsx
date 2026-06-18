/**
 * FeatureCard — a touch-friendly tool cell used in the More features grid.
 *
 * Icon tile + short label (optional count badge). Press feedback. Designed for a 2-up grid.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileColors, mobileMetrics, mobileShadow, mobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface FeatureCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  badge?: number;
  testID?: string;
}

export function FeatureCard({
  icon,
  label,
  onPress,
  badge,
  testID,
}: FeatureCardProps): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      testID={testID}
      style={[
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 12,
          borderRadius: mobileMetrics.cardRadiusSmall,
          backgroundColor: mobileColors.card,
          paddingVertical: 14,
          paddingHorizontal: 14,
          minHeight: 64,
        },
        mobileShadow,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: mobileColors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={21} color={mobileColors.primary} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: mobileType.labelSize,
          fontWeight: '600',
          color: mobileColors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      {badge && badge > 0 ? (
        <View
          style={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            paddingHorizontal: 6,
            backgroundColor: mobileColors.badge,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: mobileColors.onPrimary }}>
            {badge > 9 ? '9+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
