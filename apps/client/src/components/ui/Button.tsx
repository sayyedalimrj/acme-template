/**
 * Button primitive (Pressable wrapper).
 *
 * A cross-platform pressable with variants and accessible defaults. No DOM <button>;
 * uses React Native's Pressable so it works on Web, Android, and iOS.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

import { Text, type TextTone } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Optional leading element (e.g. an icon). */
  leading?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leading,
  disabled,
  style,
  ...rest
}: ButtonProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const isDisabled = disabled || loading;

  const paddingVertical = size === 'sm' ? tokens.spacing.xs + 2 : tokens.spacing.sm + 4;
  const paddingHorizontal = size === 'sm' ? tokens.spacing.md : tokens.spacing.lg;
  const minHeight = size === 'sm' ? 38 : 52;

  const background: Record<ButtonVariant, string> = {
    primary: tokens.color.primary,
    secondary: tokens.color.surfaceAlt,
    ghost: 'transparent',
  };
  const textTone: Record<ButtonVariant, TextTone> = {
    primary: 'onPrimary',
    secondary: 'default',
    ghost: 'primary',
  };

  const base: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    minHeight,
    paddingVertical,
    paddingHorizontal,
    borderRadius: tokens.radius.md,
    backgroundColor: background[variant],
    borderWidth: variant === 'secondary' ? tokens.borderWidth.thin : 0,
    borderColor: tokens.color.border,
    opacity: isDisabled ? 0.55 : 1,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) =>
        StyleSheet.flatten([base, pressed && !isDisabled ? { opacity: 0.85 } : null, style])
      }
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={tokens.color[variant === 'primary' ? 'onPrimary' : 'primary']}
        />
      ) : (
        <>
          {leading ? <View>{leading}</View> : null}
          <Text variant="label" tone={textTone[variant]} style={{ fontWeight: '700' }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
