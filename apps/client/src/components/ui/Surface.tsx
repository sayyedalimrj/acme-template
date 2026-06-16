/**
 * Surface (a.k.a. Panel) primitive.
 *
 * A low-level themed container: background + radius + optional border/padding/elevation.
 * Card is built on top of this idea but adds a header; use Surface directly when you need a
 * neutral panel without a title (e.g. grouping form sections, sidebars, sheets).
 */
import React, { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme, type ElevationLevel } from '@/theme';

export type SurfaceVariant = 'surface' | 'surfaceAlt' | 'chrome';

export interface SurfaceProps {
  children?: ReactNode;
  variant?: SurfaceVariant;
  padding?: keyof ReturnType<typeof useTheme>['tokens']['spacing'];
  radius?: keyof ReturnType<typeof useTheme>['tokens']['radius'];
  bordered?: boolean;
  elevation?: ElevationLevel;
  style?: ViewStyle;
  testID?: string;
}

export function Surface({
  children,
  variant = 'surface',
  padding = 'lg',
  radius = 'lg',
  bordered = false,
  elevation = 'none',
  style,
  testID,
}: SurfaceProps): React.JSX.Element {
  const { tokens, shadow } = useTheme();

  const base: ViewStyle = {
    backgroundColor: tokens.color[variant],
    borderRadius: tokens.radius[radius],
    padding: tokens.spacing[padding],
    borderWidth: bordered ? tokens.borderWidth.hairline : 0,
    borderColor: tokens.color.border,
    ...shadow(elevation),
  };

  return (
    <View testID={testID} style={[base, style]}>
      {children}
    </View>
  );
}
