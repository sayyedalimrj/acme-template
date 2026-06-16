/**
 * Design tokens for the app.
 *
 * Styling approach: typed token-based React Native StyleSheet (design.md §9, Option B).
 * Tokens are plain JS objects (no CSS variables, no className cascade) so they work
 * identically on Web, Android, and iOS. Light and dark palettes share the same shape so
 * components can read semantic roles without knowing the active mode.
 *
 * These are production-grade foundations: add new roles/scales here rather than hard-coding
 * values in components, so theming, dark mode, and future white-labeling stay centralized.
 */
import { StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';

/**
 * Semantic color roles. Components reference these roles (never raw hex) so a single token
 * change re-themes the whole app and dark mode "just works".
 */
export interface ColorTokens {
  /** App background (behind content). */
  background: string;
  /** Sidebar / topbar chrome background. */
  chrome: string;
  /** Card / elevated surface background. */
  surface: string;
  /** Subtle alternate surface (e.g. table header, hover, input fill). */
  surfaceAlt: string;
  /** Hairline borders / dividers. */
  border: string;
  /** Stronger border (e.g. focused/active outlines). */
  borderStrong: string;
  /** Primary text. */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Placeholder / disabled text. */
  textPlaceholder: string;
  /** Brand primary. */
  primary: string;
  /** Pressed/darker primary. */
  primaryStrong: string;
  /** Text/icon color on top of `primary`. */
  onPrimary: string;
  /** Soft primary tint (e.g. active nav background). */
  primarySoft: string;
  /** Focus ring color (keyboard/web focus, active inputs). */
  focusRing: string;
  /** Scrim behind modals/sheets. */
  overlay: string;
  /** Status colors (solid + soft tint background). */
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
}

export interface SpacingScale {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface RadiusScale {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
}

export interface BorderWidthScale {
  /** Sub-pixel hairline (resolves per device density). */
  hairline: number;
  thin: number;
  thick: number;
}

export interface TypographyToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}

export interface TypographyScale {
  display: TypographyToken;
  title: TypographyToken;
  heading: TypographyToken;
  subheading: TypographyToken;
  body: TypographyToken;
  label: TypographyToken;
  caption: TypographyToken;
}

/**
 * Elevation levels. Stored as semantic, platform-neutral descriptors; the `shadow()` helper
 * (theme/elevation.ts) converts a level into a platform-correct style (CSS box-shadow on
 * web, native shadow props plus Android elevation).
 */
export interface ElevationToken {
  /** Opacity of the native shadow / web shadow alpha. */
  shadowOpacity: number;
  /** Blur radius. */
  shadowRadius: number;
  /** Vertical offset. */
  offsetY: number;
  /** Android elevation. */
  elevation: number;
}

export interface ElevationScale {
  none: ElevationToken;
  sm: ElevationToken;
  md: ElevationToken;
  lg: ElevationToken;
}

export type ElevationLevel = keyof ElevationScale;

/** Layering values for stacked UI (menus, sticky chrome, modals, toasts). */
export interface ZIndexScale {
  base: number;
  dropdown: number;
  sticky: number;
  overlay: number;
  modal: number;
  toast: number;
}

export interface ThemeTokens {
  mode: ThemeMode;
  color: ColorTokens;
  spacing: SpacingScale;
  radius: RadiusScale;
  borderWidth: BorderWidthScale;
  typography: TypographyScale;
  elevation: ElevationScale;
  zIndex: ZIndexScale;
  /** Shadow color used by the elevation helper; differs per mode. */
  shadowColor: string;
}

const spacing: SpacingScale = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const radius: RadiusScale = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

const borderWidth: BorderWidthScale = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 2,
};

const typography: TypographyScale = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
};

const elevation: ElevationScale = {
  none: { shadowOpacity: 0, shadowRadius: 0, offsetY: 0, elevation: 0 },
  sm: { shadowOpacity: 0.06, shadowRadius: 6, offsetY: 2, elevation: 2 },
  md: { shadowOpacity: 0.1, shadowRadius: 12, offsetY: 4, elevation: 6 },
  lg: { shadowOpacity: 0.16, shadowRadius: 24, offsetY: 10, elevation: 12 },
};

const zIndex: ZIndexScale = {
  base: 0,
  dropdown: 10,
  sticky: 100,
  overlay: 1000,
  modal: 1100,
  toast: 1200,
};

const lightColors: ColorTokens = {
  // Ecme-aligned: soft neutral background, white panels, hairline neutral borders.
  background: '#f5f6f8',
  chrome: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f6f7f9',
  border: '#e5e7eb',
  borderStrong: '#d4d4d4',
  text: '#171717',
  textMuted: '#737373',
  textPlaceholder: '#a3a3a3',
  primary: '#2a85ff',
  primaryStrong: '#0069f6',
  onPrimary: '#ffffff',
  primarySoft: '#eaf2ff',
  focusRing: '#2a85ff',
  overlay: 'rgba(23,23,23,0.45)',
  success: '#10b981',
  successSoft: '#e6f7f0',
  warning: '#f59e0b',
  warningSoft: '#fef3df',
  danger: '#ff6a55',
  dangerSoft: '#ffe9e6',
  info: '#2a85ff',
  infoSoft: '#eaf2ff',
};

const darkColors: ColorTokens = {
  // Ecme-aligned dark: near-black neutral background, gray-800 panels, low-contrast borders.
  background: '#121316',
  chrome: '#1b1c1f',
  surface: '#1b1c1f',
  surfaceAlt: '#232427',
  border: '#2e3033',
  borderStrong: '#3a3d42',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  textPlaceholder: '#6b7280',
  primary: '#4996ff',
  primaryStrong: '#2a85ff',
  onPrimary: '#ffffff',
  primarySoft: '#16243d',
  focusRing: '#4996ff',
  overlay: 'rgba(0,0,0,0.6)',
  success: '#10b981',
  successSoft: '#12281f',
  warning: '#f59e0b',
  warningSoft: '#332811',
  danger: '#ff6a55',
  dangerSoft: '#3a1f1c',
  info: '#4996ff',
  infoSoft: '#16243d',
};

export const lightTokens: ThemeTokens = {
  mode: 'light',
  color: lightColors,
  spacing,
  radius,
  borderWidth,
  typography,
  elevation,
  zIndex,
  shadowColor: '#101828',
};

export const darkTokens: ThemeTokens = {
  mode: 'dark',
  color: darkColors,
  spacing,
  radius,
  borderWidth,
  typography,
  elevation,
  zIndex,
  shadowColor: '#000000',
};

export function getTokens(mode: ThemeMode): ThemeTokens {
  return mode === 'dark' ? darkTokens : lightTokens;
}
