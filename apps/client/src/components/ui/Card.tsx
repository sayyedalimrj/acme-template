/**
 * Card primitive.
 *
 * Elevated surface used to group dashboard content (KPIs, lists, widgets). Inspired by the
 * Ecme card rhythm but implemented from scratch with RN primitives and theme tokens.
 */
import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface CardProps {
  children: ReactNode;
  title?: string;
  /** Optional element rendered on the trailing side of the header (e.g. an action). */
  headerAction?: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export function Card({
  children,
  title,
  headerAction,
  style,
  contentStyle,
  testID,
}: CardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    // Subtle elevation; platform-aware so web and native both look right.
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(16,24,40,0.06)' } as unknown as ViewStyle,
      default: {
        shadowColor: '#101828',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
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
