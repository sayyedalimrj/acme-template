/**
 * TrendPill primitive.
 *
 * A compact delta indicator (▲ up / ▼ down / ● flat) used on KPI/metric cards. Maps a
 * semantic trend direction to a tone + arrow glyph and renders an optional change label
 * (e.g. "+12.4%"). Direction-aware and dark-mode safe via theme tokens.
 *
 * `intent` controls coloring semantics: for most metrics "up" is good (success); for cost-
 * style metrics callers can pass intent="inverse" so "up" reads as danger.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text, type TextTone } from './Text';

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendIntent = 'normal' | 'inverse';

export interface TrendPillProps {
  direction: TrendDirection;
  /** Optional change label, e.g. "+12.4%". */
  label?: string;
  intent?: TrendIntent;
  style?: ViewStyle;
  testID?: string;
}

const SYMBOL: Record<TrendDirection, string> = { up: '▲', down: '▼', flat: '●' };

export function TrendPill({
  direction,
  label,
  intent = 'normal',
  style,
  testID,
}: TrendPillProps): React.JSX.Element {
  const { tokens } = useTheme();

  // Resolve the semantic tone. For "normal" intent up=good; for "inverse" up=bad.
  const tone: TextTone =
    direction === 'flat'
      ? 'muted'
      : (direction === 'up') === (intent === 'normal')
        ? 'success'
        : 'danger';

  const bg =
    tone === 'success'
      ? tokens.color.successSoft
      : tone === 'danger'
        ? tokens.color.dangerSoft
        : tokens.color.surfaceAlt;

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    backgroundColor: bg,
    paddingVertical: 2,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
  };

  return (
    <View testID={testID} style={StyleSheet.flatten([containerStyle, style])}>
      <Text variant="caption" tone={tone} style={{ fontWeight: '700' }}>
        {SYMBOL[direction]}
        {label ? ` ${label}` : ''}
      </Text>
    </View>
  );
}
