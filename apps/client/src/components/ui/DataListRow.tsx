/**
 * DataListRow primitive.
 *
 * A reusable list row: optional leading element (icon chip/avatar/rank), a title + optional
 * subtitle, and an optional trailing element (badge/value). When `onPress` is provided it
 * becomes a pressable row with hover/press feedback and a trailing chevron — the Ecme list
 * row pattern used across dashboard widgets, queues, and detail lists. Direction-aware.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState, type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface DataListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Show the trailing chevron on pressable rows (default true when onPress is set). */
  chevron?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function DataListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron,
  style,
  testID,
}: DataListRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hovered, setHovered] = useState(false);
  const showChevron = chevron ?? Boolean(onPress);

  const inner = (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: tokens.spacing.md,
        flex: 1,
      }}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress && showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
      ) : null}
    </View>
  );

  const base: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
  };

  if (!onPress) {
    return (
      <View testID={testID} style={[base, style]}>
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        base,
        hovered || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}
