/**
 * AnimatedSection — fade + slight rise on mount (cardEnter).
 *
 * Wraps a section so it fades in and rises a few px when it first appears, with an optional
 * stagger delay so stacked sections cascade gently. Honors reduced motion (renders instantly).
 * RN Animated only.
 */
import React, { useEffect, useState, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { easing, motion, motionDuration, useReducedMotion } from '../motion';

export interface AnimatedSectionProps {
  children: ReactNode;
  /** Stagger index (multiplied by motion.stagger for the start delay). */
  index?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AnimatedSection({
  children,
  index = 0,
  style,
  testID,
}: AnimatedSectionProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motionDuration.normal,
      delay: index * motion.stagger,
      easing: easing.decelerate,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, index]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.enterTranslateY, 0],
  });

  return (
    <Animated.View
      testID={testID}
      style={[{ opacity: progress, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
