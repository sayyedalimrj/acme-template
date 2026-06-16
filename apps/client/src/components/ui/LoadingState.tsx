/**
 * LoadingState primitive.
 *
 * A centered spinner with an optional label, used as the standard "data is loading" UI.
 * Replaces ad-hoc ActivityIndicator usage so loading looks consistent app-wide.
 */
import React from 'react';
import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface LoadingStateProps {
  label?: string;
  /** Fill available space and center (default true). */
  fill?: boolean;
  size?: 'small' | 'large';
  style?: ViewStyle;
  testID?: string;
}

export function LoadingState({
  label,
  fill = true,
  size = 'large',
  style,
  testID,
}: LoadingStateProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing.sm,
          padding: tokens.spacing.lg,
        },
        fill ? { flex: 1 } : null,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={tokens.color.primary} />
      {label ? <Text tone="muted">{label}</Text> : null}
    </View>
  );
}
