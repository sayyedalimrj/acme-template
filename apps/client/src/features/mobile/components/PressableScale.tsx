/**
 * PressableScale — a Pressable that gently scales down on press.
 *
 * The standard press-feedback primitive for the mobile dashboard: scales to `motion.pressScale`
 * on press-in and springs back on release (fast, ease-out). Honors reduced motion (no scale).
 * RN Animated only.
 */
import React, { useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { easing, motion, motionDuration, useReducedMotion } from '../motion';

/**
 * Animated Pressable so that layout-affecting styles (flex, width, padding, background) AND the
 * press-scale transform live on the SAME element. Previously the style was applied to an inner
 * Animated.View while the outer Pressable had none — which broke flex distribution (e.g. the
 * bottom-nav tabs collapsed together instead of each taking equal width).
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps {
  onPress?: (event: GestureResponderEvent) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  testID?: string;
  /** Scale floor on press (defaults to motion.pressScale). */
  pressScale?: number;
}

export function PressableScale({
  onPress,
  children,
  style,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
  pressScale = motion.pressScale,
}: PressableScaleProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (value: number): void => {
    if (reduced) {
      return;
    }
    Animated.timing(scale, {
      toValue: value,
      duration: motionDuration.fast,
      easing: easing.standard,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      onPressIn={() => animateTo(pressScale)}
      onPressOut={() => animateTo(1)}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
