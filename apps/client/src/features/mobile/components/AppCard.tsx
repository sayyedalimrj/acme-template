/**
 * AppCard — the standard soft rounded surface for the mobile app.
 *
 * A white card with consistent radius + soft shadow + padding, used to group content on the
 * mobile screens so cards never look flat or stuck together. Optionally pressable (adds gentle
 * press-scale feedback). RN primitives only.
 */
import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { mobileColors, mobileMetrics, mobileShadow } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface AppCardProps {
  children: ReactNode;
  /** Inner padding (default 16). */
  padding?: number;
  /** Card radius (default cardRadius = 18). */
  radius?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({
  children,
  padding = 16,
  radius = mobileMetrics.cardRadius,
  onPress,
  accessibilityLabel,
  testID,
  style,
}: AppCardProps): React.JSX.Element {
  const cardStyle: StyleProp<ViewStyle> = [
    {
      borderRadius: radius,
      backgroundColor: mobileColors.card,
      padding,
    },
    mobileShadow,
    style,
  ];

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        pressScale={0.985}
        style={cardStyle}
      >
        {children}
      </PressableScale>
    );
  }

  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}
