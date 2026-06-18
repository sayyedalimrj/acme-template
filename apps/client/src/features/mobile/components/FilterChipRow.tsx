/**
 * FilterChipRow — a compact, low-density row of filter chips.
 *
 * A small set of soft chips (wraps instead of horizontal-scrolling to stay RTL-correct and
 * avoid overflow). The active chip uses a soft blue surface; inactive chips use a muted gray.
 * Press feedback via PressableScale.
 */
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileColors, mobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterChipRowProps<T extends string> {
  options: readonly FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}

export function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  testID,
}: FilterChipRowProps<T>): React.JSX.Element {
  const { rowDirection } = useTheme();

  return (
    <View testID={testID} style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            pressScale={0.95}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? mobileColors.primarySoft : mobileColors.tile,
            }}
          >
            <Text
              style={{
                fontSize: mobileType.captionSize,
                fontWeight: active ? '700' : '500',
                color: active ? mobileColors.primary : mobileColors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
