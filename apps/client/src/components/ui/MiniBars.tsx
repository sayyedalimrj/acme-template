/**
 * MiniBars: a dependency-free vertical bar chart built from RN Views.
 *
 * Renders proportional vertical bars (height = value / max) over a light gridline backdrop
 * with a baseline, optional value labels above each bar, and x-axis labels below. A bar can
 * be highlighted (e.g. the best day / current period) with the accent color; other bars use
 * a soft tinted fill so the panel reads as a real chart rather than raw rows.
 *
 * Intentionally lightweight — NOT a charting library; it composes inside a ChartCard for
 * compact dashboard/report visuals. Cross-platform (no SVG/DOM), direction-aware, dark-safe.
 * For richer charts later we standardize on a react-native-svg wrapper (see tech.md).
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
  /** Optional pre-formatted value label shown above the bar (falls back to the number). */
  valueLabel?: string;
}

export type MiniBarsTone = 'primary' | 'success' | 'info' | 'warning';

export interface MiniBarsProps {
  data: MiniBarDatum[];
  /** Chart drawing height in px (default 120). */
  height?: number;
  tone?: MiniBarsTone;
  /** Render the per-bar x-axis labels (default true). */
  showLabels?: boolean;
  /** Render value labels above each bar (default true). */
  showValues?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function MiniBars({
  data,
  height = 120,
  tone = 'primary',
  showLabels = true,
  showValues = true,
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

  const accentSoft =
    tone === 'success'
      ? tokens.color.successSoft
      : tone === 'info'
        ? tokens.color.infoSoft
        : tone === 'warning'
          ? tokens.color.warningSoft
          : tokens.color.primarySoft;

  // Three evenly-spaced horizontal gridlines (incl. the baseline) for a chart-like backdrop.
  const gridFractions = [0, 0.5, 1];

  return (
    <View testID={testID} style={[{ gap: tokens.spacing.sm }, style]}>
      <View style={{ height, justifyContent: 'flex-end' }}>
        {/* Gridlines backdrop. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
          {gridFractions.map((f) => (
            <View
              key={f}
              style={{
                position: 'absolute',
                top: f * height,
                left: 0,
                right: 0,
                height: tokens.borderWidth.hairline,
                backgroundColor: tokens.color.border,
                opacity: f === 1 ? 1 : 0.5,
              }}
            />
          ))}
        </View>

        {/* Bars. */}
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'flex-end',
            gap: tokens.spacing.sm,
            height,
          }}
        >
          {data.map((d, index) => {
            const safe = Number.isFinite(d.value) && d.value > 0 ? d.value : 0;
            // Reserve headroom for the value label so tall bars don't clip it.
            const barHeight = Math.max(4, Math.round((safe / max) * (height - 22)));
            return (
              <View
                key={`${d.label}-${index}`}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
              >
                {showValues ? (
                  <Text
                    variant="caption"
                    tone={d.highlight ? 'primary' : 'muted'}
                    numberOfLines={1}
                    style={{ marginBottom: 4, fontWeight: '600' }}
                  >
                    {d.valueLabel ?? String(d.value)}
                  </Text>
                ) : null}
                <View
                  style={{
                    width: '64%',
                    maxWidth: 56,
                    height: barHeight,
                    borderTopLeftRadius: tokens.radius.sm,
                    borderTopRightRadius: tokens.radius.sm,
                    backgroundColor: d.highlight ? accent : accentSoft,
                    borderWidth: tokens.borderWidth.hairline,
                    borderColor: d.highlight ? accent : tokens.color.border,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      {showLabels ? (
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm }}>
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
