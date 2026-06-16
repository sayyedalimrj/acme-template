/**
 * FormField wrapper.
 *
 * Composes a FieldLabel + an arbitrary control (children) + optional help/error text into a
 * consistent, accessible vertical layout. This is the building block forms will use in the
 * Products/Settings tasks; it intentionally does not own form state (that belongs to
 * react-hook-form per the design), keeping it reusable.
 */
import React, { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { FieldLabel } from './FieldLabel';
import { Text } from './Text';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  /** Help text shown under the control when there is no error. */
  help?: string;
  /** Error text; when present it replaces help text and signals invalid state. */
  error?: string;
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function FormField({
  label,
  required,
  help,
  error,
  children,
  style,
  testID,
}: FormFieldProps): React.JSX.Element {
  const { tokens } = useTheme();
  const message = error ?? help;

  return (
    <View testID={testID} style={[{ gap: tokens.spacing.xs }, style]}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      {children}
      {message ? (
        <Text variant="caption" tone={error ? 'danger' : 'muted'} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
