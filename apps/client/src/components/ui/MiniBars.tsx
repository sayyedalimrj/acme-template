/**
 * MiniBars: a dependency-free vertical bar chart built from RN Views.
 *
 * Renders proportional vertical bars (height = value / max) with optional x-axis labels and
 * a highlighted bar (e.g. the best day / current period). Intentionally lightweight — it is
 * NOT a charting library; it composes inside a ChartCard for compact dashboard/report trend
 * visuals. Cross-platform (no SVG/DOM), direction-aware, and theme/dark-mode safe.
 *
 * For richer charts later we standardize on a react-native-svg wrapper (see tech.md); this
 * stays as the lightweight option used by mock-first analytics.
 */
import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface MiniBarDatum {
  /** X-axis label (kept short). */
  label: string;
  /** Non-negative numeric value. */
  value: number;
  /** Highlight this bar with the accent color. */
  highlight?: boolean;
}

export type MiniBarsTone = 'primary' | 'success' | 'info' | 'warning';

export interface MiniBarsProps {
  data: MiniBarDatum[];
  /** Chart drawing height in px (default 96). */
  height?: number;
  tone?: MiniBarsTone;
  /** Render the per-bar x-axis labels (default true). */
  showLabels?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function MiniBars({
  data,
  height = 96,
  tone = 'primary',
  showLabels = true,
  style,
  testID,
}: MiniBarsProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const max = Math.max(1, ...data.map((d) => (Number.isFinite(d.value) ? d.value : 0)));

  const accent =
    tone === 'success'
      ? tokens.color.success
      : tone === 'info'
        ? tokens.color.info
        : tone === 'warning'
          ? tokens.color.warning
          : tokens.color.primary;

  return (
    <View testID={testID} style={[{ gap: tokens.spacing.xs }, style]}>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'flex-end',
          gap: tokens.spacing.xs,
          height,
        }}
      >
        {data.map((d, index) => {
          const safe = Number.isFinite(d.value) && d.value > 0 ? d.value : 0;
          const barHeight = Math.max(3, Math.round((safe / max) * height));
          return (
            <View
              key={`${d.label}-${index}`}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  width: '70%',
                  height: barHeight,
                  borderTopLeftRadius: tokens.radius.sm,
                  borderTopRightRadius: tokens.radius.sm,
                  backgroundColor: d.highlight ? accent : tokens.color.surfaceAlt,
                  borderWidth: d.highlight ? 0 : tokens.borderWidth.hairline,
                  borderColor: tokens.color.border,
                }}
              />
            </View>
          );
        })}
      </View>
      {showLabels ? (
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs }}>
          {data.map((d, index) => (
            <View key={`${d.label}-label-${index}`} style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
