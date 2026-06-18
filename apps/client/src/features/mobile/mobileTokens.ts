/**
 * Mobile visual tokens (mobile-first, reference-derived) — repair pass.
 *
 * Self-contained design tokens for the customer-facing mobile app. Light and dark palettes
 * share the same shape so components can read semantic roles without knowing the active mode.
 * Use `useMobileColors()` inside React components; `getMobileColors(mode)` for non-hook code.
 *
 * See `mobileUxSpec.ts` for the consolidated spec + research basis.
 */
import { useMemo } from 'react';

import { useTheme, type ThemeMode } from '@/theme';

/** Semantic mobile color roles (light and dark share this shape). */
export interface MobileColorTokens {
  background: string;
  /** Soft backdrop behind the centered frame on wide/desktop viewports. */
  pageBackdrop: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  text: string;
  textSecondary: string;
  muted: string;
  mutedSoft: string;
  tile: string;
  card: string;
  hero: string;
  heroDeep: string;
  heroLayer: string;
  heroText: string;
  heroTextSoft: string;
  bottomNav: string;
  navActive: string;
  navInactive: string;
  statusActive: string;
  statusActiveSoft: string;
  statusAttention: string;
  statusAttentionSoft: string;
  statusDanger: string;
  statusDangerSoft: string;
  statusOffline: string;
  statusOfflineSoft: string;
  badge: string;
  separator: string;
  frameBorder: string;
}

/** Light palette — calm ink-blue text, soft separators, single brand blue. */
export const lightMobileColors: MobileColorTokens = {
  background: '#FFFFFF',
  pageBackdrop: '#EEF1F6',
  primary: '#456EFE',
  primaryPressed: '#3457D8',
  primarySoft: 'rgba(69, 110, 254, 0.10)',
  onPrimary: '#FFFFFF',
  text: '#23303B',
  textSecondary: '#8E949A',
  muted: '#A4A9AE',
  mutedSoft: '#B4B2C8',
  tile: 'rgba(164, 169, 174, 0.14)',
  card: '#FFFFFF',
  hero: '#23303B',
  heroDeep: '#1F2D38',
  heroLayer: 'rgba(255, 255, 255, 0.08)',
  heroText: '#FFFFFF',
  heroTextSoft: 'rgba(255, 255, 255, 0.70)',
  bottomNav: '#FBFBFD',
  navActive: '#456EFE',
  navInactive: '#9AA0A6',
  statusActive: '#2BA770',
  statusActiveSoft: 'rgba(43, 167, 112, 0.12)',
  statusAttention: '#D9971B',
  statusAttentionSoft: 'rgba(217, 151, 27, 0.14)',
  statusDanger: '#E5575B',
  statusDangerSoft: 'rgba(229, 87, 91, 0.12)',
  statusOffline: '#9AA0A6',
  statusOfflineSoft: 'rgba(154, 160, 166, 0.14)',
  badge: '#E5575B',
  separator: 'rgba(35, 48, 59, 0.06)',
  frameBorder: 'rgba(35, 48, 59, 0.05)',
};

/** Dark palette — near-black surfaces, muted borders, lifted brand blue. */
export const darkMobileColors: MobileColorTokens = {
  background: '#0F1114',
  pageBackdrop: '#08090B',
  primary: '#6E8CFF',
  primaryPressed: '#456EFE',
  primarySoft: 'rgba(110, 140, 255, 0.16)',
  onPrimary: '#FFFFFF',
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  muted: '#6B7280',
  mutedSoft: '#4B5563',
  tile: 'rgba(255, 255, 255, 0.06)',
  card: '#1B1C1F',
  hero: '#1B1C1F',
  heroDeep: '#14161A',
  heroLayer: 'rgba(255, 255, 255, 0.06)',
  heroText: '#F3F4F6',
  heroTextSoft: 'rgba(243, 244, 246, 0.70)',
  bottomNav: '#14161A',
  navActive: '#6E8CFF',
  navInactive: '#6B7280',
  statusActive: '#34D399',
  statusActiveSoft: 'rgba(52, 211, 153, 0.14)',
  statusAttention: '#FBBF24',
  statusAttentionSoft: 'rgba(251, 191, 36, 0.14)',
  statusDanger: '#F87171',
  statusDangerSoft: 'rgba(248, 113, 113, 0.14)',
  statusOffline: '#6B7280',
  statusOfflineSoft: 'rgba(107, 114, 128, 0.14)',
  badge: '#F87171',
  separator: 'rgba(255, 255, 255, 0.08)',
  frameBorder: 'rgba(255, 255, 255, 0.06)',
};

/** @deprecated Use `useMobileColors()` or `lightMobileColors` instead. */
export const mobileColors = lightMobileColors;

export function getMobileColors(mode: ThemeMode): MobileColorTokens {
  return mode === 'dark' ? darkMobileColors : lightMobileColors;
}

export function useMobileColors(): MobileColorTokens {
  const { mode } = useTheme();
  return useMemo(() => getMobileColors(mode), [mode]);
}

export interface MobileShadowToken {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

const lightMobileShadow: MobileShadowToken = {
  shadowColor: '#6E7588',
  shadowOpacity: 0.1,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

const darkMobileShadow: MobileShadowToken = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};

/** @deprecated Use `useMobileShadow()` instead. */
export const mobileShadow = lightMobileShadow;

export function getMobileShadow(mode: ThemeMode): MobileShadowToken {
  return mode === 'dark' ? darkMobileShadow : lightMobileShadow;
}

export function useMobileShadow(): MobileShadowToken {
  const { mode } = useTheme();
  return useMemo(() => getMobileShadow(mode), [mode]);
}

const lightMobileFrameShadow: MobileShadowToken = {
  shadowColor: '#23303B',
  shadowOpacity: 0.1,
  shadowRadius: 32,
  shadowOffset: { width: 0, height: 16 },
  elevation: 8,
};

const darkMobileFrameShadow: MobileShadowToken = {
  shadowColor: '#000000',
  shadowOpacity: 0.5,
  shadowRadius: 32,
  shadowOffset: { width: 0, height: 16 },
  elevation: 12,
};

/** @deprecated Use `useMobileFrameShadow()` instead. */
export const mobileFrameShadow = lightMobileFrameShadow;

export function getMobileFrameShadow(mode: ThemeMode): MobileShadowToken {
  return mode === 'dark' ? darkMobileFrameShadow : lightMobileFrameShadow;
}

export function useMobileFrameShadow(): MobileShadowToken {
  const { mode } = useTheme();
  return useMemo(() => getMobileFrameShadow(mode), [mode]);
}

/** Layout dimensions (dp/px) — see mobileUxSpec.ts for rationale. */
export const mobileMetrics = {
  frameMaxWidth: 448,
  desktopBreakpoint: 600,
  frameRadius: 30,
  screenPadding: 22,
  sectionGap: 22,
  cardGap: 14,
  headerHeight: 56,
  heroHeight: 200,
  heroRadius: 20,
  quickActionHeight: 116,
  serviceTile: 60,
  listRowHeight: 74,
  bottomNavHeight: 62,
  tapTargetMin: 48,
  buttonHeight: 56,
  buttonRadius: 14,
  avatarSize: 44,
  headerButton: 42,
  cardRadius: 18,
  cardRadiusSmall: 14,
  tileRadius: 15,
} as const;

/** Typography sizes/weights. Titles not too huge; avoid ultra-bold everywhere. */
export const mobileType = {
  greetingSize: 13,
  titleSize: 21,
  titleWeight: '700' as const,
  sectionSize: 16,
  sectionWeight: '700' as const,
  bodySize: 15,
  labelSize: 14,
  labelWeight: '600' as const,
  captionSize: 13,
  heroTitleSize: 19,
  heroLabelSize: 13,
} as const;
