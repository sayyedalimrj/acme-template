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
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@/theme';

/**
 * Remove the default browser focus outline on web (our own blue border is the focus indicator).
 * No-op on native. `outline*` are web-only CSS props, so the value is cast to TextStyle.
 */
const NO_WEB_OUTLINE: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle) : {};

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

  // Soft-fill input (matches the mobile search field): a calm gray fill with no resting border,
  // and a clear blue (or danger) border on focus/error for an accessible focus indicator.
  const borderColor = invalid
    ? tokens.color.danger
    : focused
      ? tokens.color.focusRing
      : 'transparent';

  const inputStyle: TextStyle = {
    minHeight: 48,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.borderWidth.thick,
    borderColor,
    backgroundColor: tokens.color.surfaceAlt,
    opacity: editable ? 1 : 0.6,
    color: tokens.color.text,
    fontSize: tokens.typography.body.fontSize,
    // writingDirection keeps caret/alignment correct under RTL.
    textAlign: direction === 'rtl' ? 'right' : 'left',
    ...NO_WEB_OUTLINE,
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
