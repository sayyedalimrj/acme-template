/**
 * Input primitive.
 *
 * A themed wrapper around React Native's TextInput with focus and error states. It exposes
 * the full TextInput props surface (so it works on Web, Android, iOS) while standardizing
 * styling via tokens. No DOM <input> is used.
 *
 * For labels and error/help text, compose with FormField.
 */
import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface InputProps extends TextInputProps {
  /** Renders error styling (border/focus ring in danger color). */
  invalid?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { invalid = false, style, onFocus, onBlur, editable = true, ...rest },
  ref,
) {
  const { tokens, direction } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = invalid
    ? tokens.color.danger
    : focused
      ? tokens.color.focusRing
      : tokens.color.border;

  const inputStyle: TextStyle = {
    minHeight: 44,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: focused || invalid ? tokens.borderWidth.thick : tokens.borderWidth.thin,
    borderColor,
    backgroundColor: editable ? tokens.color.surface : tokens.color.surfaceAlt,
    opacity: editable ? 1 : 0.7,
    color: tokens.color.text,
    fontSize: tokens.typography.body.fontSize,
    // writingDirection keeps caret/alignment correct under RTL.
    textAlign: direction === 'rtl' ? 'right' : 'left',
  };

  return (
    <TextInput
      ref={ref}
      editable={editable}
      placeholderTextColor={tokens.color.textPlaceholder}
      style={StyleSheet.flatten([inputStyle, style])}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      accessibilityState={{ disabled: !editable }}
      {...rest}
    />
  );
});
