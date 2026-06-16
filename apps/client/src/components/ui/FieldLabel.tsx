/**
 * FieldLabel primitive.
 *
 * Accessible label for form fields. Shows an optional required marker. Pair with Input via
 * FormField, or use standalone above any control.
 */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  /** nativeID to associate with an input via accessibilityLabelledBy. */
  nativeID?: string;
}

export function FieldLabel({
  label,
  required = false,
  nativeID,
}: FieldLabelProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View style={{ flexDirection: rowDirection, gap: 2 }}>
      <Text variant="label" nativeID={nativeID}>
        {label}
      </Text>
      {required ? (
        <Text variant="label" style={{ color: tokens.color.danger }} accessibilityLabel="required">
          *
        </Text>
      ) : null}
    </View>
  );
}
