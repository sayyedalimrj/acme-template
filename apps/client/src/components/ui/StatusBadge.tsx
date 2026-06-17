/**
 * StatusBadge primitive.
 *
 * A status pill that adds a leading status dot to the base Badge tone system. Useful for
 * connection/site/health/severity statuses where Ecme shows a colored dot + label. Pure
 * presentation: callers map their domain status to a `tone` + `label`.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { type BadgeTone } from './Badge';
import { Text } from './Text';

export interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Show the leading status dot (default true). */
  dot?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function StatusBadge({
  label,
  tone = 'neutral',
  dot = true,
  style,
  testID,
}: StatusBadgeProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();

  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: tokens.color.surfaceAlt, fg: tokens.color.textMuted },
    primary: { bg: tokens.color.primarySoft, fg: tokens.color.primary },
    success: { bg: tokens.color.successSoft, fg: tokens.color.success },
    warning: { bg: tokens.color.warningSoft, fg: tokens.color.warning },
    danger: { bg: tokens.color.dangerSoft, fg: tokens.color.danger },
    info: { bg: tokens.color.infoSoft, fg: tokens.color.info },
  };

  const containerStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: tokens.spacing.xs + 1,
    backgroundColor: palette[tone].bg,
    paddingVertical: 3,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
  };

  return (
    <View testID={testID} style={StyleSheet.flatten([containerStyle, style])}>
      {dot ? (
        <View
          style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: palette[tone].fg }}
        />
      ) : null}
      <Text variant="caption" style={{ color: palette[tone].fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
