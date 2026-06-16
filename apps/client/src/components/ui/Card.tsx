/**
 * Card primitive.
 *
 * Elevated surface used to group dashboard content (KPIs, lists, widgets). Inspired by the
 * Ecme card rhythm but implemented from scratch with RN primitives and theme tokens.
 */
import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme, type ElevationLevel } from '@/theme';

import { Text } from './Text';

export interface CardProps {
  children: ReactNode;
  title?: string;
  /** Optional element rendered on the trailing side of the header (e.g. an action). */
  headerAction?: ReactNode;
  /** Shadow depth. Defaults to a subtle 'sm'. */
  elevation?: ElevationLevel;
  /** Padding override (token spacing key). Defaults to 'lg'. */
  padding?: keyof ReturnType<typeof useTheme>['tokens']['spacing'];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export function Card({
  children,
  title,
  headerAction,
  elevation = 'sm',
  padding = 'lg',
  style,
  contentStyle,
  testID,
}: CardProps): React.JSX.Element {
  const { tokens, rowDirection, shadow } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: tokens.borderWidth.hairline,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[padding],
    gap: tokens.spacing.md,
    // Subtle, platform-aware elevation (web box-shadow / native shadow+elevation).
    ...shadow(elevation),
  };

  return (
    <View testID={testID} style={StyleSheet.flatten([cardStyle, style])}>
      {(title || headerAction) && (
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: tokens.spacing.sm,
          }}
        >
          {title ? <Text variant="subheading">{title}</Text> : <View />}
          {headerAction}
        </View>
      )}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
