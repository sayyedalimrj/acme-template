/**
 * ConversationPanel — the mock chat thread + composer, restyled for a calmer, more polished
 * look: assistant messages get a soft sparkle avatar and a tinted bubble aligned to the start;
 * the merchant's messages use a filled primary bubble aligned to the end. Replies are
 * deterministic and generated locally — no AI provider, no network.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Input, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { AIAdvisorConversationMessage } from '@/domain/types';

function Avatar(): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: tokens.color.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="sparkles" size={15} color={tokens.color.onPrimary} />
    </View>
  );
}

function Bubble({ message }: { message: AIAdvisorConversationMessage }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const isUser = message.role === 'user';

  const bubble = (
    <View
      style={{
        maxWidth: '82%',
        paddingVertical: tokens.spacing.sm,
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.lg,
        backgroundColor: isUser ? tokens.color.primary : tokens.color.surfaceAlt,
        borderTopStartRadius: isUser ? tokens.radius.lg : tokens.radius.sm,
        borderTopEndRadius: isUser ? tokens.radius.sm : tokens.radius.lg,
      }}
    >
      <Text
        variant="body"
        style={{ color: isUser ? tokens.color.onPrimary : tokens.color.text }}
      >
        {message.text}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: rowDirection,
        gap: tokens.spacing.sm,
        alignItems: 'flex-end',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {isUser ? null : <Avatar />}
      {bubble}
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
      <View style={{ gap: tokens.spacing.md }}>
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        {sending ? (
          <View
            style={{
              flexDirection: rowDirection,
              gap: tokens.spacing.sm,
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
            }}
          >
            <Avatar />
            <View
              style={{
                paddingVertical: tokens.spacing.sm,
                paddingHorizontal: tokens.spacing.md,
                borderRadius: tokens.radius.lg,
                backgroundColor: tokens.color.surfaceAlt,
              }}
            >
              <Text variant="body" tone="muted">
                {t('advisor.chat.sending')}
              </Text>
            </View>
          </View>
        ) : null}
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
            style={{ minHeight: 56, textAlignVertical: 'top' }}
            onSubmitEditing={submit}
          />
        </View>
        <SendButton
          onPress={submit}
          disabled={sending || draft.trim().length === 0}
          label={t('advisor.chat.send')}
        />
      </View>

      <Text variant="caption" tone="muted">
        {t('advisor.chat.disclaimer')}
      </Text>
    </View>
  );
}

function SendButton({
  onPress,
  disabled,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  label: string;
}): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID="advisor-send"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: tokens.radius.md,
        backgroundColor: disabled
          ? tokens.color.surfaceAlt
          : pressed
            ? tokens.color.primaryStrong
            : tokens.color.primary,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Ionicons
        name="send"
        size={18}
        color={disabled ? tokens.color.textPlaceholder : tokens.color.onPrimary}
      />
    </Pressable>
  );
}
