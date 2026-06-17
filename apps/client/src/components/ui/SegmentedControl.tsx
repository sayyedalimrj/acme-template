/**
 * SegmentedControl primitive.
 *
 * An Ecme-style segmented switch for small, mutually-exclusive option sets (filters with
 * ~2–6 values). Replaces wrapped "chip jungles" with a single calm track: a muted rail with
 * a raised active segment. Horizontally scrollable so longer option sets never wrap into a
 * messy block. Generic over the value type, direction-aware, dark-mode safe, RN-only.
 */
import React from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch segments to fill the available width (good for 2–4 options). */
  stretch?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  stretch = false,
  style,
  testID,
}: SegmentedControlProps<T>): React.JSX.Element {
  const { tokens, rowDirection, shadow } = useTheme();

  const track: ViewStyle = {
    flexDirection: rowDirection,
    backgroundColor: tokens.color.surfaceAlt,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.borderWidth.hairline,
    borderColor: tokens.color.border,
    padding: 3,
    gap: 3,
  };

  const segments = options.map((option) => {
    const active = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(option.value)}
        style={[
          {
            paddingVertical: tokens.spacing.xs + 2,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: tokens.radius.md - 3,
            alignItems: 'center',
            justifyContent: 'center',
            flex: stretch ? 1 : undefined,
          },
          active
            ? { backgroundColor: tokens.color.surface, ...shadow('sm') }
            : null,
        ]}
      >
        <Text
          variant="caption"
          tone={active ? 'primary' : 'muted'}
          numberOfLines={1}
          style={{ fontWeight: active ? '700' : '500' }}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (stretch) {
    return (
      <View testID={testID} style={[track, style]}>
        {segments}
      </View>
    );
  }

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[track, style]}
    >
      {segments}
    </ScrollView>
  );
}
