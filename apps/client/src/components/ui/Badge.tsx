/**
 * Badge / Tag primitive.
 *
 * Compact status pill used for order/product statuses. Maps a semantic `tone` to soft
 * background + solid foreground from theme tokens.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps): React.JSX.Element {
  const { tokens } = useTheme();

  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: tokens.color.surfaceAlt, fg: tokens.color.textMuted },
    primary: { bg: tokens.color.primarySoft, fg: tokens.color.primary },
    success: { bg: tokens.color.successSoft, fg: tokens.color.success },
    warning: { bg: tokens.color.warningSoft, fg: tokens.color.warning },
    danger: { bg: tokens.color.dangerSoft, fg: tokens.color.danger },
    info: { bg: tokens.color.infoSoft, fg: tokens.color.info },
  };

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    backgroundColor: palette[tone].bg,
    paddingVertical: 2,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
  };

  return (
    <View style={StyleSheet.flatten([containerStyle, style])}>
      <Text variant="caption" style={{ color: palette[tone].fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
