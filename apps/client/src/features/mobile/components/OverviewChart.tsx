/**
 * OverviewChart — a calm, dependency-free "at a glance" bar chart for the mobile home.
 *
 * Built only from RN Views (no SVG/DOM, no chart library) so it runs identically on Web,
 * Android, and iOS. Proportional vertical bars over soft gridlines, with the latest/peak bar
 * highlighted in the brand color. RTL-safe via the theme row direction.
 */
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileColors } from '../mobileTokens';

export interface OverviewPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

export interface OverviewChartProps {
  data: OverviewPoint[];
  height?: number;
  testID?: string;
}

export function OverviewChart({ data, height = 132, testID }: OverviewChartProps): React.JSX.Element {
  const { rowDirection } = useTheme();
  const max = Math.max(1, ...data.map((d) => (Number.isFinite(d.value) ? d.value : 0)));
  const gridFractions = [0, 0.5, 1];

  return (
    <View testID={testID} style={{ gap: 8 }}>
      <View style={{ height, justifyContent: 'flex-end' }}>
        {/* Soft gridline backdrop. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
          {gridFractions.map((f) => (
            <View
              key={f}
              style={{
                position: 'absolute',
                top: f * height,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: mobileColors.separator,
                opacity: f === 1 ? 1 : 0.6,
              }}
            />
          ))}
        </View>

        {/* Bars. */}
        <View
          style={{ flexDirection: rowDirection, alignItems: 'flex-end', gap: 8, height }}
        >
          {data.map((d, index) => {
            const safe = Number.isFinite(d.value) && d.value > 0 ? d.value : 0;
            const barHeight = Math.max(6, Math.round((safe / max) * (height - 10)));
            return (
              <View
                key={`${d.label}-${index}`}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
              >
                <View
                  style={{
                    width: '70%',
                    maxWidth: 30,
                    height: barHeight,
                    borderRadius: 7,
                    backgroundColor: d.highlight ? mobileColors.primary : mobileColors.primarySoft,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: rowDirection, gap: 8 }}>
        {data.map((d, index) => (
          <View key={`${d.label}-label-${index}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: d.highlight ? mobileColors.text : mobileColors.textSecondary,
                fontWeight: d.highlight ? '700' : '500',
              }}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
