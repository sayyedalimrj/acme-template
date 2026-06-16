/**
 * PromptSuggestions — clickable prompt chips that send a mock message to the advisor.
 */
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { AIAdvisorPromptSuggestion } from '@/domain/types';

export interface PromptSuggestionsProps {
  prompts: AIAdvisorPromptSuggestion[];
  disabled?: boolean;
  onSelect: (text: string) => void;
}

export function PromptSuggestions({
  prompts,
  disabled = false,
  onSelect,
}: PromptSuggestionsProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      testID="advisor-prompts"
      style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}
    >
      {prompts.map((prompt) => (
        <Pressable
          key={prompt.id}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onSelect(prompt.text)}
          style={({ pressed }) => [
            {
              paddingVertical: tokens.spacing.sm,
              paddingHorizontal: tokens.spacing.md,
              borderRadius: tokens.radius.pill,
              borderWidth: tokens.borderWidth.thin,
              borderColor: tokens.color.border,
              backgroundColor: tokens.color.surface,
              opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text variant="caption" tone="primary">
            {prompt.text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
