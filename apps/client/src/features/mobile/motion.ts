/**
 * Mobile motion system (tokens + reduced-motion + helpers).
 *
 * A small, dependency-free motion language for the mobile dashboard. Durations/easing follow
 * Material 3 motion guidance (small transitions ~150–200ms; standard ~200–300ms; larger/
 * emphasized ~300–350ms) and use a decelerate (ease-out) curve for entrances. Built on React
 * Native's Animated + LayoutAnimation + Pressable feedback only — no Reanimated, no heavy deps
 * (Reanimated is not installed in this app, so it is intentionally not used).
 *
 * Accessibility: motion respects the OS "Reduce Motion" setting via AccessibilityInfo; when it
 * is on, animations collapse to instant. See MOBILE_UI_SPEC.md.
 */
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  type EasingFunction,
} from 'react-native';

/** Duration tokens (ms). */
export const motionDuration = {
  fast: 140,
  normal: 220,
  slow: 320,
} as const;

/** Interaction/animation parameters. */
export const motion = {
  duration: motionDuration,
  /** Press feedback scale for tappable cards/buttons. */
  pressScale: 0.97,
  /** Entrance translateY offset (px) for cards/sections. */
  enterTranslateY: 12,
  /** Stagger between sequential section entrances (ms). */
  stagger: 60,
} as const;

/** Easing tokens (Material-style). Entrances decelerate; exits accelerate. */
export const easing: Record<'standard' | 'decelerate' | 'accelerate', EasingFunction> = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
};

/**
 * Subscribe to the OS "Reduce Motion" preference. Returns `true` when reduced motion is on, so
 * components can collapse animations to instant. Uses RN core APIs only.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) {
          setReduced(value);
        }
      })
      .catch(() => {
        /* default to motion enabled */
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduced(value);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

// Enable LayoutAnimation on Android (no-op on iOS/web).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Trigger a soft layout animation for expand/collapse (e.g. the "More" expand). Honors reduced
 * motion by skipping the animation entirely.
 */
export function animateLayout(reduced: boolean, duration: number = motionDuration.normal): void {
  if (reduced) {
    return;
  }
  LayoutAnimation.configureNext({
    duration,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}
