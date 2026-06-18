/**
 * AnimatedCard — a soft card that enters with fade + rise and (optionally) presses with scale.
 *
 * Combines the entrance motion (`AnimatedSection`) with the standard card surface (soft shadow,
 * rounded) and, when `onPress` is provided, press feedback (`PressableScale`). Keeps motion
 * consistent across the dashboard. RN primitives only; reduced-motion aware via the underlying
 * components.
 */
import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { mobileColors, mobileMetrics, mobileShadow } from '../mobileTokens';
import { AnimatedSection } from './AnimatedSection';
import { PressableScale } from './PressableScale';

export interface AnimatedCardProps {
  children: ReactNode;
  onPress?: () => void;
  /** Stagger index for the entrance. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  /** Render without the default card surface (caller styles it). */
  bare?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function AnimatedCard({
  children,
  onPress,
  index = 0,
  style,
  bare = false,
  accessibilityLabel,
  testID,
}: AnimatedCardProps): React.JSX.Element {
  const surface: StyleProp<ViewStyle> = bare
    ? null
    : [
        {
          backgroundColor: mobileColors.card,
          borderRadius: mobileMetrics.cardRadius,
          padding: 16,
        },
        mobileShadow,
      ];

  return (
    <AnimatedSection index={index} testID={testID}>
      {onPress ? (
        <PressableScale
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          style={[surface, style]}
        >
          {children}
        </PressableScale>
      ) : (
        <View style={[surface, style]}>{children}</View>
      )}
    </AnimatedSection>
  );
}
