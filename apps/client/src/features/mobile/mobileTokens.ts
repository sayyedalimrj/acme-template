/**
 * Mobile dashboard visual tokens (mobile-first, reference-derived).
 *
 * Self-contained design tokens for the customer-facing mobile dashboard. Like the auth tokens
 * (PR #39), these intentionally do NOT mutate the global theme (`src/theme`) so the rest of
 * the app is unaffected; they extend the same visual direction into the merchant home.
 *
 * Dimensions follow official mobile guidance (see MOBILE_UI_SPEC.md): Apple HIG min tap target
 * 44pt and Material min touch target 48dp. Font family comes from the existing app stack
 * (no font files added here — see auth tokens font note).
 */

/** Colors from the dashboard reference. */
export const mobileColors = {
  background: '#FFFFFF',
  /** Soft backdrop behind the centered frame on wide/desktop viewports. */
  pageBackdrop: '#EEF1F6',
  primary: '#456EFE',
  primaryPressed: '#3457D8',
  onPrimary: '#FFFFFF',
  /** Primary text. */
  text: '#23303B',
  /** Secondary text. */
  textSecondary: '#A4A9AE',
  /** Muted text. */
  muted: '#8E949A',
  /** Extra-muted (placeholder-like). */
  mutedSoft: '#B4B2C8',
  /** Soft gray tile / chip background. */
  tile: 'rgba(164, 169, 174, 0.15)',
  /** Card surface. */
  card: '#FFFFFF',
  /** Hero (dark) card background. */
  hero: '#23303B',
  /** Subtle layer on the hero card. */
  heroLayer: 'rgba(255, 255, 255, 0.08)',
  heroText: '#FFFFFF',
  heroTextSoft: 'rgba(255, 255, 255, 0.72)',
  /** Bottom nav background. */
  bottomNav: '#F9F9FB',
  navActive: '#456EFE',
  navInactive: '#8E949A',
  /** Status tones (customer-friendly). */
  statusActive: '#2BA770',
  statusActiveSoft: 'rgba(43, 167, 112, 0.14)',
  statusAttention: '#E0A50E',
  statusAttentionSoft: 'rgba(224, 165, 14, 0.16)',
  statusOffline: '#8E949A',
  statusOfflineSoft: 'rgba(142, 148, 154, 0.16)',
  /** Unread/badge red. */
  badge: '#E5484D',
  /** Hairline separators. */
  separator: 'rgba(35, 48, 59, 0.07)',
  frameBorder: 'rgba(35, 48, 59, 0.06)',
} as const;

/** Soft card shadow (≈ 1px 5px 40px rgba(110,117,136,0.07)). RN-only shadow props. */
export const mobileShadow = {
  shadowColor: '#6E7588',
  shadowOpacity: 0.12,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

/** Layout dimensions (dp/px) — see MOBILE_UI_SPEC.md for rationale. */
export const mobileMetrics = {
  /** Design width target + centered-frame max width. */
  frameMaxWidth: 440,
  /** Desktop centers the frame instead of stretching. */
  desktopBreakpoint: 600,
  /** Frame radius for the centered desktop preview. */
  frameRadius: 34,
  /** Page horizontal padding. */
  screenPadding: 26,
  /** Header row height. */
  headerHeight: 54,
  /** Hero card height. */
  heroHeight: 214,
  /** Quick action card size. */
  quickActionWidth: 100,
  quickActionHeight: 122,
  /** Service / feature icon tile size. */
  serviceTile: 70,
  /** List row height. */
  listRowHeight: 76,
  /** Bottom nav bar height (excludes safe-area inset, which is added on top). */
  bottomNavHeight: 64,
  /** Minimum primary tap target. */
  tapTargetMin: 48,
  /** Avatar circle. */
  avatarSize: 44,
  /** Header icon button. */
  headerButton: 44,
  /** Generic card radii. */
  cardRadius: 16,
  cardRadiusSmall: 12,
  tileRadius: 16,
} as const;

/** Typography sizes/weights (family from the app stack). Never below ~12–13px. */
export const mobileType = {
  greetingSize: 14,
  titleSize: 22,
  titleWeight: '700' as const,
  sectionSize: 17,
  sectionWeight: '700' as const,
  bodySize: 15,
  labelSize: 14,
  labelWeight: '600' as const,
  captionSize: 13,
  heroTitleSize: 20,
  heroLabelSize: 13,
} as const;
