/**
 * Auth-flow visual tokens (mobile-first, Figma-derived).
 *
 * Self-contained design tokens for the merchant-facing auth flow ONLY. They intentionally do
 * not touch the global theme (`src/theme`) so the rest of the app is unaffected. These can be
 * reused by later client mobile screens as the visual direction is rolled out.
 *
 * Font note: the reference uses an IRANYekanX-like family. That font is NOT bundled in this
 * repo (no licensed font files are added here), so the existing app font stack / system
 * fallback is used. TODO(font): bundle a licensed Persian display font and wire it in.
 */

/** Colors lifted from the Figma reference. */
export const authColors = {
  /** Screen / frame background. */
  background: '#FFFFFF',
  /** Soft page backdrop shown behind the centered frame on wide/desktop viewports. */
  pageBackdrop: '#EEF1F6',
  /** Primary brand blue (buttons, icon circle, focus border). */
  primary: '#456EFE',
  /** Pressed/active state for the primary blue. */
  primaryPressed: '#3457D8',
  /** Text/icon color on the primary blue. */
  onPrimary: '#FFFFFF',
  /** Main text. */
  text: '#23303B',
  /** Secondary text (subtitles, helper). */
  textSecondary: '#A4A9AE',
  /** Muted placeholder / label. */
  muted: '#B4B2C8',
  /** Soft gray input background. */
  inputBackground: 'rgba(164, 169, 174, 0.15)',
  /** Default (unfocused) input/otp border — transparent so only the soft fill shows. */
  inputBorder: 'transparent',
  /** Focused input/otp border. */
  inputBorderFocused: '#456EFE',
  /** Error border + error text. */
  danger: '#E5484D',
  /** Circular icon background. */
  iconCircle: '#456EFE',
  /** Circular back-button background. */
  backButtonBackground: 'rgba(164, 169, 174, 0.15)',
  /** Subtle border for the centered frame card on desktop. */
  frameBorder: 'rgba(35, 48, 59, 0.06)',
} as const;

/** Sizing/metrics lifted from the Figma reference (in dp/px). */
export const authMetrics = {
  /** Max width of the centered mobile frame (desktop centers this instead of stretching). */
  frameMaxWidth: 430,
  /** Mobile card/frame corner radius. */
  frameRadius: 35,
  /** Primary circular icon diameter. */
  iconCircleSize: 120,
  /** Inner icon glyph size. */
  iconGlyphSize: 54,
  /** Primary button height + radius. */
  buttonHeight: 63,
  buttonRadius: 10,
  /** Text input height + radius. */
  inputHeight: 65,
  inputRadius: 7,
  /** OTP box dimensions + radius. */
  otpBoxWidth: 60,
  otpBoxHeight: 59,
  otpRadius: 5,
  /** Circular back button diameter. */
  backButtonSize: 44,
  /** Horizontal screen padding. */
  screenPadding: 24,
  /** Width at/above which we render the centered desktop frame. */
  desktopBreakpoint: 600,
} as const;

/** Typography sizing for the auth flow (weights/sizes only; family comes from the app stack). */
export const authType = {
  titleSize: 26,
  titleWeight: '700' as const,
  subtitleSize: 15,
  labelSize: 14,
  labelWeight: '600' as const,
  inputSize: 17,
  buttonSize: 17,
  buttonWeight: '700' as const,
  helperSize: 13,
  otpSize: 24,
} as const;
