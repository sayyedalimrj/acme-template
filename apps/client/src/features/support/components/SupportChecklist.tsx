/**
 * SupportChecklist — the playbook steps for a request, each toggleable (mock-only). Shows a
 * progress count. Toggling calls back to the parent which performs the in-memory mutation.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Divider, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SupportChecklistItem } from '@/domain/types';

export interface SupportChecklistProps {
  items: SupportChecklistItem[];
  disabled?: boolean;
  onToggle: (checklistItemId: string) => void;
}

export function SupportChecklist({
  items,
  disabled = false,
  onToggle,
}: SupportChecklistProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const done = items.filter((i) => i.done).length;

  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <Text variant="caption" tone="muted">
        {t('support.checklist.progress')}: {done}/{items.length}
      </Text>
      {items.map((item, index) => (
        <View key={item.id} style={{ gap: tokens.spacing.sm }}>
          {index > 0 ? <Divider /> : null}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done, disabled }}
            disabled={disabled}
            onPress={() => onToggle(item.id)}
            style={({ pressed }) => [
              {
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: tokens.spacing.sm,
                opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={item.done ? 'checkbox' : 'square-outline'}
              size={20}
              color={item.done ? tokens.color.success : tokens.color.textMuted}
            />
            <Text
              variant="body"
              style={{ flex: 1, color: item.done ? tokens.color.textMuted : tokens.color.text }}
            >
              {item.label}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
