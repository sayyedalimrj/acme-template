/**
 * MetricCard primitive.
 *
 * A compact KPI/stat card: an uppercase micro-label, a large value, an optional trend pill,
 * and a tinted circular icon chip — the Ecme stat-widget rhythm rebuilt with RN primitives.
 * Optionally pressable (deep-links a metric to its module). Extracted from the dashboard so
 * the dashboard, reports, and the future platform-admin overview share one stat card.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState, type ComponentProps } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme, type ColorTokens } from '@/theme';

import { Card } from './Card';
import { Text } from './Text';
import { TrendPill, type TrendDirection, type TrendIntent } from './TrendPill';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
export type MetricTint = 'primary' | 'success' | 'warning' | 'info' | 'danger';

const TINT: Record<MetricTint, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  primary: { bg: 'primarySoft', fg: 'primary' },
  success: { bg: 'successSoft', fg: 'success' },
  warning: { bg: 'warningSoft', fg: 'warning' },
  info: { bg: 'infoSoft', fg: 'info' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
};

export interface MetricCardProps {
  label: string;
  value: string;
  icon: IoniconName;
  tint?: MetricTint;
  /** Optional trend direction; renders a TrendPill when provided. */
  trend?: TrendDirection;
  /** Optional change label paired with the trend (e.g. "+12.4%"). */
  trendLabel?: string;
  /** Trend coloring semantics (see TrendPill). */
  trendIntent?: TrendIntent;
  /** Optional caption under the value (e.g. "vs last 30 days"). */
  caption?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  tint = 'primary',
  trend,
  trendLabel,
  trendIntent,
  caption,
  onPress,
  style,
  testID,
}: MetricCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hovered, setHovered] = useState(false);

  const content = (
    <Card
      testID={testID}
      contentStyle={{ gap: 0 }}
      style={[hovered ? { borderColor: tokens.color.borderStrong } : undefined, style]}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: tokens.spacing.xs }}>
          <Text
            variant="caption"
            tone="muted"
            style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}
          >
            {label}
          </Text>
          <Text variant="title" numberOfLines={1}>
            {value}
          </Text>
          {trend ? <TrendPill direction={trend} label={trendLabel} intent={trendIntent} /> : null}
          {caption ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {caption}
            </Text>
          ) : null}
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color[TINT[tint].bg],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={tokens.color[TINT[tint].fg]} />
        </View>
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
    >
      {content}
    </Pressable>
  );
}
