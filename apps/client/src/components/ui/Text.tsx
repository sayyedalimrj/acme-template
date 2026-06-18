/**
 * Text primitive.
 *
 * Wraps React Native's <Text> and maps a `variant` to typography tokens and a `tone` to
 * semantic color roles. Components should use this instead of raw <Text> so typography and
 * color stay consistent and theme/dark-mode aware.
 */
import React from 'react';
import { Platform, StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme';
import type { TypographyScale } from '@/theme/tokens';

export type TextVariant = keyof TypographyScale;

/**
 * Web-only Persian-first font stack. We cannot bundle a custom font in this environment
 * (Kook is proprietary/web-only woff; the OFL Vazirmatn TTF + expo-font can't be fetched
 * under the restricted registry). On the web preview we prefer clean Persian sans fonts if
 * present and fall back to system sans; on native we use the platform default (a comma stack
 * is invalid on native), so this is a no-op there. See PR notes for the font follow-up.
 */
// Persian-first font stack (web only). TODO: bundle a licensed Persian font asset later
// (e.g. `B Yekan` / `IRANYekanX`) via expo-font and prepend it here.
const WEB_FONT_STACK =
  "'B Yekan', 'IRANYekanX', 'Vazirmatn', 'Vazir', 'IRANSansX', 'IRANSans', 'Tahoma', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const FONT_FAMILY = Platform.OS === 'web' ? WEB_FONT_STACK : undefined;
export type TextTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onPrimary';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const { tokens, isRTL } = useTheme();
  const typography = tokens.typography[variant];

  const toneColor: Record<TextTone, string> = {
    default: tokens.color.text,
    muted: tokens.color.textMuted,
    primary: tokens.color.primary,
    success: tokens.color.success,
    warning: tokens.color.warning,
    danger: tokens.color.danger,
    onPrimary: tokens.color.onPrimary,
  };

  // Prevent Persian glyph clipping on native: when a caller overrides `fontSize` via `style`
  // (common on the mobile screens) but not `lineHeight`, the variant's smaller line height
  // would clip ascenders/descenders on iOS/Android. Derive a safe line height from the
  // effective font size in that case; otherwise keep the designed variant line height.
  const flat = (StyleSheet.flatten(style) ?? {}) as { fontSize?: number; lineHeight?: number };
  const hasCustomFontSize = typeof flat.fontSize === 'number';
  const lineHeight =
    typeof flat.lineHeight === 'number'
      ? flat.lineHeight
      : hasCustomFontSize
        ? Math.round((flat.fontSize as number) * 1.45)
        : typography.lineHeight;

  return (
    <RNText
      style={StyleSheet.flatten([
        {
          fontSize: typography.fontSize,
          lineHeight,
          fontWeight: typography.fontWeight,
          fontFamily: FONT_FAMILY,
          color: toneColor[tone],
          // RTL-aware: text reads in the active direction and aligns to its start edge.
          // Explicit `textAlign` passed via `style` still overrides this default.
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        style,
      ])}
      {...rest}
    />
  );
}
