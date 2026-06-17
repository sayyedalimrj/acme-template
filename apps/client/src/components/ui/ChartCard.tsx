/**
 * ChartCard primitive.
 *
 * A Card specialized for analytics: a title, optional subtitle/caption, an optional trailing
 * control slot (e.g. a period selector or "view report" link), the chart body (children),
 * and an optional legend row. Recreates Ecme's chart-panel header rhythm with RN primitives.
 * It owns no chart logic — compose MiniBars or any RN content inside it.
 */
import React, { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Card } from './Card';
import { Text } from './Text';

export interface ChartLegendItem {
  label: string;
  color: string;
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Trailing header control (period chips, link, badge). */
  headerAction?: ReactNode;
  /** Legend entries rendered under the chart body. */
  legend?: ChartLegendItem[];
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function ChartCard({
  title,
  subtitle,
  headerAction,
  legend,
  children,
  style,
  testID,
}: ChartCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();

  return (
    // No Card title/headerAction: we render a richer header (title + subtitle) inside the
    // body so the chart panel can show a caption line the base Card header does not.
    <Card testID={testID} style={style} contentStyle={{ gap: tokens.spacing.md }}>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="subheading">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerAction}
      </View>

      {children}

      {legend && legend.length > 0 ? (
        <View
          style={{
            flexDirection: rowDirection,
            flexWrap: 'wrap',
            gap: tokens.spacing.md,
            paddingTop: tokens.spacing.xs,
          }}
        >
          {legend.map((item) => (
            <View
              key={item.label}
              style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: item.color,
                  borderWidth: tokens.borderWidth.hairline,
                  borderColor: tokens.color.border,
                }}
              />
              <Text variant="caption" tone="muted">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
