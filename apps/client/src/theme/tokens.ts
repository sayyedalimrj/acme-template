/**
 * Design tokens for the app.
 *
 * Styling approach: typed token-based React Native StyleSheet (design.md §9, Option B).
 * Tokens are plain JS objects (no CSS variables, no className cascade) so they work
 * identically on Web, Android, and iOS. Light and dark palettes share the same shape so
 * components can read semantic roles without knowing the active mode.
 */

export type ThemeMode = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';

export interface ColorTokens {
  /** App background (behind content). */
  background: string;
  /** Sidebar / topbar chrome background. */
  chrome: string;
  /** Card / elevated surface background. */
  surface: string;
  /** Subtle alternate surface (e.g. table header, hover). */
  surfaceAlt: string;
  /** Hairline borders / dividers. */
  border: string;
  /** Primary text. */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Brand primary. */
  primary: string;
  /** Text/icon color on top of `primary`. */
  onPrimary: string;
  /** Soft primary tint (e.g. active nav background). */
  primarySoft: string;
  /** Status colors. */
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
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface RadiusScale {
  sm: number;
  md: number;
  lg: number;
  pill: number;
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

export interface ThemeTokens {
  mode: ThemeMode;
  color: ColorTokens;
  spacing: SpacingScale;
  radius: RadiusScale;
  typography: TypographyScale;
}

const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const radius: RadiusScale = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
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

const lightColors: ColorTokens = {
  background: '#f4f5f7',
  chrome: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f0f1f4',
  border: '#e3e6eb',
  text: '#1a1f2b',
  textMuted: '#697586',
  primary: '#2a6df4',
  onPrimary: '#ffffff',
  primarySoft: '#e7f0ff',
  success: '#1f9d63',
  successSoft: '#e3f5ec',
  warning: '#c9820b',
  warningSoft: '#fbf0d9',
  danger: '#d23f3f',
  dangerSoft: '#fbe5e5',
  info: '#2a6df4',
  infoSoft: '#e7f0ff',
};

const darkColors: ColorTokens = {
  background: '#0f131a',
  chrome: '#161b24',
  surface: '#1b212c',
  surfaceAlt: '#222a37',
  border: '#2c3543',
  text: '#eef1f6',
  textMuted: '#9aa6b6',
  primary: '#5b8cff',
  onPrimary: '#0f131a',
  primarySoft: '#1d2a44',
  success: '#43c486',
  successSoft: '#163528',
  warning: '#e2a73c',
  warningSoft: '#3a2f15',
  danger: '#f06a6a',
  dangerSoft: '#3a1f1f',
  info: '#5b8cff',
  infoSoft: '#1d2a44',
};

export const lightTokens: ThemeTokens = {
  mode: 'light',
  color: lightColors,
  spacing,
  radius,
  typography,
};

export const darkTokens: ThemeTokens = {
  mode: 'dark',
  color: darkColors,
  spacing,
  radius,
  typography,
};

export function getTokens(mode: ThemeMode): ThemeTokens {
  return mode === 'dark' ? darkTokens : lightTokens;
}
