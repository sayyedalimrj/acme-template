/**
 * Text primitive.
 *
 * Wraps React Native's <Text> and maps a `variant` to typography tokens and a `tone` to
 * semantic color roles. Components should use this instead of raw <Text> so typography and
 * color stay consistent and theme/dark-mode aware.
 */
import React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { resolveFontFamilyForWeight, useAppFont, useTheme } from '@/theme';
import type { TypographyScale } from '@/theme/tokens';

export type TextVariant = keyof TypographyScale;

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
  const { fontsLoaded } = useAppFont();
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

  const flat = (StyleSheet.flatten(style) ?? {}) as {
    fontSize?: number;
    lineHeight?: number;
    fontWeight?: string | number;
  };
  const hasCustomFontSize = typeof flat.fontSize === 'number';
  const lineHeight =
    typeof flat.lineHeight === 'number'
      ? flat.lineHeight
      : hasCustomFontSize
        ? Math.round((flat.fontSize as number) * 1.45)
        : typography.lineHeight;

  const fontFamily = resolveFontFamilyForWeight(fontsLoaded, flat.fontWeight ?? typography.fontWeight);

  return (
    <RNText
      style={StyleSheet.flatten([
        {
          fontSize: typography.fontSize,
          lineHeight,
          fontWeight: typography.fontWeight,
          fontFamily,
          color: toneColor[tone],
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        style,
        fontFamily ? { fontFamily } : null,
      ])}
      {...rest}
    />
  );
}
