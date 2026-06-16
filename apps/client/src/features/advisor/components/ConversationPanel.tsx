/**
 * ConversationPanel — the mock chat. Renders the message thread (user vs. assistant bubbles)
 * and a composer. Replies are deterministic and generated locally — no AI provider/network.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { AIAdvisorConversationMessage } from '@/domain/types';

interface BubbleProps {
  message: AIAdvisorConversationMessage;
}

function Bubble({ message }: BubbleProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const isUser = message.role === 'user';
  return (
    <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <Surface
        variant={isUser ? 'surface' : 'surfaceAlt'}
        bordered
        padding="sm"
        style={{
          maxWidth: '92%',
          gap: 2,
          borderColor: isUser ? tokens.color.primary : tokens.color.border,
        }}
      >
        <Text variant="caption" tone="muted">
          {isUser ? t('advisor.chat.you') : t('advisor.chat.assistant')}
        </Text>
        <Text variant="body">{message.text}</Text>
      </Surface>
    </View>
  );
}

export interface ConversationPanelProps {
  messages: AIAdvisorConversationMessage[];
  sending?: boolean;
  onSend: (text: string) => void;
}

export function ConversationPanel({
  messages,
  sending = false,
  onSend,
}: ConversationPanelProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (text.length === 0) return;
    onSend(text);
    setDraft('');
  };

  return (
    <View style={{ gap: tokens.spacing.md }} testID="advisor-conversation">
      <View style={{ gap: tokens.spacing.sm }}>
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
      </View>

      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Input
            value={draft}
            onChangeText={setDraft}
            placeholder={t('advisor.chat.placeholder')}
            editable={!sending}
            multiline
            numberOfLines={2}
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />
        </View>
        <Button
          label={sending ? t('advisor.chat.sending') : t('advisor.chat.send')}
          size="sm"
          loading={sending}
          onPress={submit}
          leading={<Ionicons name="send-outline" size={15} color={tokens.color.onPrimary} />}
        />
      </View>

      <Text variant="caption" tone="muted">
        {t('advisor.chat.disclaimer')}
      </Text>
    </View>
  );
}
