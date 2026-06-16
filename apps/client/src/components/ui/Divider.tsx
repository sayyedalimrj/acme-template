/**
 * Divider primitive.
 *
 * A theme-aware hairline separator. Supports horizontal (default) and vertical orientation
 * with optional spacing. Built from a single RN View.
 */
import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  /** Margin applied along the main axis (token spacing key). */
  spacing?: keyof ReturnType<typeof useTheme>['tokens']['spacing'];
  style?: ViewStyle;
}

export function Divider({
  orientation = 'horizontal',
  spacing = 'none',
  style,
}: DividerProps): React.JSX.Element {
  const { tokens } = useTheme();
  const gap = tokens.spacing[spacing];

  const base: ViewStyle =
    orientation === 'horizontal'
      ? {
          height: tokens.borderWidth.hairline,
          alignSelf: 'stretch',
          backgroundColor: tokens.color.border,
          marginVertical: gap,
        }
      : {
          width: tokens.borderWidth.hairline,
          alignSelf: 'stretch',
          backgroundColor: tokens.color.border,
          marginHorizontal: gap,
        };

  return <View accessibilityRole="none" style={[base, style]} />;
}
