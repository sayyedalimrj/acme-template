/**
 * MockActionButton primitive.
 *
 * A clearly-disabled action used wherever the UI shows an operation that is not wired yet
 * (mock/placeholder). It renders the existing Button in a disabled state with a leading lock
 * glyph and an optional micro-caption (e.g. "Mock") so reviewers and users immediately see
 * the action is non-functional. This keeps placeholder affordances honest and consistent and
 * prevents accidental real calls (there is no onPress).
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Button, type ButtonSize, type ButtonVariant } from './Button';
import { Text } from './Text';

export interface MockActionButtonProps {
  label: string;
  /** Optional micro-caption shown under the button (e.g. a localized "Mock" tag). */
  note?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  testID?: string;
}

export function MockActionButton({
  label,
  note,
  variant = 'secondary',
  size = 'sm',
  style,
  testID,
}: MockActionButtonProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View testID={testID} style={[{ gap: 2, alignSelf: 'flex-start' }, style]}>
      <Button
        label={label}
        variant={variant}
        size={size}
        disabled
        accessibilityHint={note}
        leading={<Ionicons name="lock-closed-outline" size={14} color={tokens.color.textMuted} />}
      />
      {note ? (
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}
