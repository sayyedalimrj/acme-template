/**
 * Mobile visual tokens (mobile-first, reference-derived) — repair pass.
 *
 * Self-contained design tokens for the customer-facing mobile app. They intentionally do NOT
 * mutate the global theme (`src/theme`) so the rest of the app is unaffected. Values were
 * tuned in the UI/UX repair pass for calmer spacing, softer surfaces, and a premium feel.
 *
 * See `mobileUxSpec.ts` for the consolidated spec + research basis. Font family comes from the
 * shared Persian-first stack (no font files are bundled here — see the font note in
 * `mobileUxSpec.ts`).
 */

/** Colors — blended, premium, few bright badges, muted chip backgrounds. */
export const mobileColors = {
  background: '#FFFFFF',
  /** Soft backdrop behind the centered frame on wide/desktop viewports. */
  pageBackdrop: '#EEF1F6',
  primary: '#456EFE',
  primaryPressed: '#3457D8',
  /** Soft blue surface for tiles/chips on light backgrounds. */
  primarySoft: 'rgba(69, 110, 254, 0.10)',
  onPrimary: '#FFFFFF',
  /** Primary text. */
  text: '#23303B',
  /** Secondary text. */
  textSecondary: '#8E949A',
  /** Muted text. */
  muted: '#A4A9AE',
  /** Extra-muted (placeholder-like). */
  mutedSoft: '#B4B2C8',
  /** Soft gray tile / chip background. */
  tile: 'rgba(164, 169, 174, 0.14)',
  /** Card surface. */
  card: '#FFFFFF',
  /** Hero (dark) card background + a slightly deeper variant. */
  hero: '#23303B',
  heroDeep: '#1F2D38',
  /** Subtle layer on the hero card. */
  heroLayer: 'rgba(255, 255, 255, 0.08)',
  heroText: '#FFFFFF',
  heroTextSoft: 'rgba(255, 255, 255, 0.70)',
  /** Bottom nav background. */
  bottomNav: '#FBFBFD',
  navActive: '#456EFE',
  navInactive: '#9AA0A6',
  /** Status tones (customer-friendly) — soft, not harsh. */
  statusActive: '#2BA770',
  statusActiveSoft: 'rgba(43, 167, 112, 0.12)',
  statusAttention: '#D9971B',
  statusAttentionSoft: 'rgba(217, 151, 27, 0.14)',
  statusDanger: '#E5575B',
  statusDangerSoft: 'rgba(229, 87, 91, 0.12)',
  statusOffline: '#9AA0A6',
  statusOfflineSoft: 'rgba(154, 160, 166, 0.14)',
  /** Unread/badge red. */
  badge: '#E5575B',
  /** Hairline separators (no harsh borders). */
  separator: 'rgba(35, 48, 59, 0.06)',
  frameBorder: 'rgba(35, 48, 59, 0.05)',
} as const;

/** Soft card shadow (≈ 1px 5px 40px rgba(110,117,136,0.07)). RN-only shadow props. */
export const mobileShadow = {
  shadowColor: '#6E7588',
  shadowOpacity: 0.1,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
} as const;

/** A slightly stronger shadow for the centered desktop frame. */
export const mobileFrameShadow = {
  shadowColor: '#23303B',
  shadowOpacity: 0.1,
  shadowRadius: 32,
  shadowOffset: { width: 0, height: 16 },
  elevation: 8,
} as const;

/** Layout dimensions (dp/px) — see mobileUxSpec.ts for rationale. */
export const mobileMetrics = {
  /** Centered-frame max width (desktop centers; never stretches). */
  frameMaxWidth: 448,
  /** At/above this width we render the centered desktop frame. */
  desktopBreakpoint: 600,
  /** Frame radius for the centered desktop preview. */
  frameRadius: 30,
  /** Page horizontal padding. */
  screenPadding: 22,
  /** Vertical gap between stacked sections. */
  sectionGap: 22,
  /** Gap between cards in a row/grid. */
  cardGap: 14,
  /** Header row height. */
  headerHeight: 56,
  /** Hero card height + radius. */
  heroHeight: 200,
  heroRadius: 20,
  /** Quick action card size. */
  quickActionHeight: 116,
  /** Service / feature icon tile size. */
  serviceTile: 60,
  /** List row height. */
  listRowHeight: 74,
  /** Bottom nav bar content height (safe-area inset added on top). */
  bottomNavHeight: 62,
  /** Minimum primary tap target. */
  tapTargetMin: 48,
  /** Primary button height. */
  buttonHeight: 56,
  buttonRadius: 14,
  /** Avatar / header icon button. */
  avatarSize: 44,
  headerButton: 42,
  /** Generic card radii. */
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
