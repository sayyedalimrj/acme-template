/**
 * mobileUxSpec — the consolidated mobile UI/UX spec for the client app.
 *
 * One place that ties together the dimension tokens (`mobileTokens`), the motion tokens
 * (`motion`), the Persian-first font stack, and the route-transition guidance used across the
 * customer-facing mobile screens.
 */
import { Platform, type TextStyle } from 'react-native';

import { useAppFont } from '@/theme';
import { resolveInputFontFamily, resolveTextFontFamily } from '@/theme/fonts';

import { easing, motion, motionDuration } from './motion';
import { lightMobileColors, mobileMetrics, mobileType } from './mobileTokens';

export const PERSIAN_FONT_STACK =
  "'IRANYekanX', 'Vazirmatn', 'Vazir', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Web fallback when expo-font has not finished loading yet. */
export const MOBILE_FONT_FAMILY = Platform.OS === 'web' ? PERSIAN_FONT_STACK : undefined;

/** Hook: resolved font family for raw RN TextInput on the current platform. */
export function useMobileFontFamily(fontWeight?: string | number): string | undefined {
  const { fontsLoaded } = useAppFont();
  return resolveInputFontFamily(fontsLoaded, fontWeight);
}

/** Hook: resolved font family for raw RN Text labels on the current platform. */
export function useMobileTextFontFamily(): string | undefined {
  const { fontsLoaded } = useAppFont();
  return resolveTextFontFamily(fontsLoaded);
}

export const NO_WEB_OUTLINE: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle) : {};

export const ROUTE_TRANSITION = {
  animation: 'slide_from_right' as const,
  durationMs: motionDuration.normal,
  note: 'Keep page transitions subtle; content also softly appears via AnimatedSection.',
} as const;

/** Static spec snapshot (light palette). Runtime screens use `useMobileColors()`. */
export const mobileUxSpec = {
  layout: {
    maxWidth: mobileMetrics.frameMaxWidth,
    pagePadding: mobileMetrics.screenPadding,
    sectionGap: mobileMetrics.sectionGap,
    cardGap: mobileMetrics.cardGap,
    headerHeight: mobileMetrics.headerHeight,
    heroHeight: mobileMetrics.heroHeight,
    heroRadius: mobileMetrics.heroRadius,
    quickActionHeight: mobileMetrics.quickActionHeight,
    iconTile: mobileMetrics.serviceTile,
    listRowHeight: mobileMetrics.listRowHeight,
    bottomNavHeight: mobileMetrics.bottomNavHeight,
    tapTargetMin: mobileMetrics.tapTargetMin,
    cardRadius: mobileMetrics.cardRadius,
    buttonHeight: mobileMetrics.buttonHeight,
  },
  type: mobileType,
  color: lightMobileColors,
  motion: {
    durations: motionDuration,
    pressScale: motion.pressScale,
    enterTranslateY: motion.enterTranslateY,
    stagger: motion.stagger,
    easing: Object.keys(easing),
  },
  transition: ROUTE_TRANSITION,
  font: { stack: PERSIAN_FONT_STACK, family: 'IRANYekanX Pro (Farsi numerals)' },
} as const;
