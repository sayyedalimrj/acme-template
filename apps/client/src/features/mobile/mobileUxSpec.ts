/**
 * mobileUxSpec — the consolidated mobile UI/UX spec for the client app.
 *
 * One place that ties together the dimension tokens (`mobileTokens`), the motion tokens
 * (`motion`), the Persian-first font stack, and the route-transition guidance used across the
 * customer-facing mobile screens. Grounded in a short research pass on official guidance:
 *  - Tap targets: Apple HIG min 44pt; Material min 48dp (we use 48 for primary targets).
 *  - Bottom navigation: Material navigation bar with 3–5 destinations, short labels, no
 *    overlap, height + bottom safe-area inset (we use 4 tabs).
 *  - Motion: Material small transitions ~150–200ms, standard ~200–300ms, larger ~300–350ms;
 *    entrances decelerate (ease-out), exits accelerate.
 *  - Web focus: remove the default browser outline on inputs and provide our own visible
 *    focus (blue border) so focus stays accessible without the ugly black square.
 * _Content was rephrased for compliance with licensing restrictions._
 *
 * FONT NOTE: Persian is primary. We use a Persian-first font *stack* with system fallback.
 * No font files are bundled in this repo. TODO: use a licensed Persian font asset later
 * (e.g. `B Yekan` / `IRANYekanX`) bundled via expo-font.
 */
import { Platform, type TextStyle } from 'react-native';

import { easing, motion, motionDuration } from './motion';
import { mobileColors, mobileMetrics, mobileType } from './mobileTokens';

/**
 * Persian-first font stack (web only; native uses the platform default, since a comma stack
 * is invalid on native). Used by the client Text primitive and mobile inputs.
 * TODO: bundle a licensed `B Yekan` / `IRANYekanX` asset and prepend it here.
 */
export const PERSIAN_FONT_STACK =
  "'B Yekan', 'IRANYekanX', 'Vazirmatn', 'Vazir', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Resolved font family for the current platform (undefined on native = system default). */
export const MOBILE_FONT_FAMILY = Platform.OS === 'web' ? PERSIAN_FONT_STACK : undefined;

/**
 * Style fragment that removes the ugly default web focus outline on inputs. Apply to every
 * mobile TextInput; the visible focus indicator is our own blue border (kept for a11y).
 * No-op on native. (`outline*` are web-only CSS props, so the value is cast to TextStyle.)
 */
export const NO_WEB_OUTLINE: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle) : {};

/** Route transition guidance for Expo Router stacks (kept subtle; no heavy deps). */
export const ROUTE_TRANSITION = {
  /** Prefer a soft slide+fade where the stack supports it; otherwise rely on section enter. */
  animation: 'slide_from_right' as const,
  durationMs: motionDuration.normal,
  note: 'Keep page transitions subtle; content also softly appears via AnimatedSection.',
} as const;

/** The consolidated spec object (dimensions + type + motion + transitions). */
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
  color: mobileColors,
  motion: {
    durations: motionDuration,
    pressScale: motion.pressScale,
    enterTranslateY: motion.enterTranslateY,
    stagger: motion.stagger,
    easing: Object.keys(easing),
  },
  transition: ROUTE_TRANSITION,
  font: { stack: PERSIAN_FONT_STACK, todo: 'Use a licensed Persian font asset later.' },
} as const;
