/**
 * ChatHistoryPanel — lists previously-saved advisor conversations so the merchant can reopen
 * them. Each row shows the derived title and a message count; tapping reopens the session.
 * Frontend-only (in-memory) — no backend, no persistence across reloads.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Divider, EmptyState, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import type { AdvisorChatSession } from '../useAdvisorChat';

export interface ChatHistoryPanelProps {
  sessions: AdvisorChatSession[];
  onOpen: (id: string) => void;
}

export function ChatHistoryPanel({ sessions, onOpen }: ChatHistoryPanelProps): React.JSX.Element {
  const { tokens, rowDirection, directional } = useTheme();
  const t = useT();

  if (sessions.length === 0) {
    return (
      <EmptyState
        title={t('advisor.history.empty')}
        icon="chatbubbles-outline"
        fill={false}
      />
    );
  }

  return (
    <View>
      {sessions.map((session, index) => (
        <View key={session.id}>
          {index > 0 ? <Divider /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('advisor.history.open')}: ${session.title}`}
            testID={`advisor-history-${index}`}
            onPress={() => onOpen(session.id)}
            style={({ pressed }) => ({
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: tokens.radius.pill,
                backgroundColor: tokens.color.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="time-outline" size={18} color={tokens.color.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text variant="label" numberOfLines={1}>
                {session.title}
              </Text>
              <Text variant="caption" tone="muted">
                {session.messages.length} {t('advisor.history.messageCount')}
              </Text>
            </View>
            <Ionicons
              name={directional('chevron-forward', 'chevron-back')}
              size={18}
              color={tokens.color.textMuted}
            />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
