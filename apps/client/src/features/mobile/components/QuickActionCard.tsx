/**
 * QuickActionCard — one of the four primary home actions.
 *
 * Icon tile + short label + optional count badge, with press feedback. Sized per the spec
 * (~100×122). No long explanations.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

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

  // Adaptive ONE-LINE label. `adjustsFontSizeToFit` is a no-op on react-native-web, so we shrink
  // the font ourselves to fit the measured label width on narrow phones — the label never wraps
  // to a second line. If even the minimum size cannot fit, numberOfLines={1} ellipsizes (last
  // resort). Purely local: no change to card size, colors, spacing, icon, or layout.
  const baseFont = Math.round(type.captionSize * 0.92);
  const minFont = Math.max(10, Math.round(baseFont * 0.7));
  const [labelWidth, setLabelWidth] = useState(0);
  const fittedFont =
    labelWidth > 0
      ? Math.max(minFont, Math.min(baseFont, Math.floor(labelWidth / Math.max(1, label.length * 0.62))))
      : baseFont;
  const onLabelLayout = (e: LayoutChangeEvent): void => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - labelWidth) > 1) setLabelWidth(w);
  };

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
      <View onLayout={onLabelLayout} style={{ alignSelf: 'stretch' }}>
        <Text
          style={{
            fontSize: fittedFont,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
