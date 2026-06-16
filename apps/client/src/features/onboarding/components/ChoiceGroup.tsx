/**
 * ChoiceGroup — a small, generic single-select control built from RN primitives.
 *
 * Renders a wrapped row of pressable pills (radio-group semantics) for choosing one option
 * from a short list. Used for platform confirmation, request type, and business type. Kept
 * local to the onboarding feature; it composes existing theme tokens and the Text primitive.
 */
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface Choice<T extends string> {
  value: T;
  label: string;
}

export interface ChoiceGroupProps<T extends string> {
  value: T | null;
  choices: Choice<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  testID?: string;
}

export function ChoiceGroup<T extends string>({
  value,
  choices,
  onChange,
  disabled = false,
  testID,
}: ChoiceGroupProps<T>): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      testID={testID}
      style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}
    >
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(choice.value)}
            style={({ pressed }) => [
              {
                paddingVertical: tokens.spacing.sm,
                paddingHorizontal: tokens.spacing.md,
                borderRadius: tokens.radius.pill,
                borderWidth: tokens.borderWidth.thin,
                borderColor: selected ? tokens.color.primary : tokens.color.border,
                backgroundColor: selected ? tokens.color.primarySoft : tokens.color.surface,
                opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              variant="label"
              style={{
                color: selected ? tokens.color.primary : tokens.color.text,
                fontWeight: selected ? '600' : '500',
              }}
            >
              {choice.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
