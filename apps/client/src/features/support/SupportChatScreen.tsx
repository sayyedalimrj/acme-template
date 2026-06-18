/**
 * SupportChatScreen — a real (mock) support messenger.
 *
 * A conversation thread with message bubbles (RTL-correct), an agent header, and a sticky
 * compose bar. Sending a message appends it to the local thread and triggers a canned agent
 * auto-reply. MOCK-ONLY and FRONTEND-SAFE: there is no chat backend, no provider, and nothing
 * is sent anywhere — the conversation lives only in component state.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { MobileSubHeader, PressableScale } from '@/features/mobile/components';
import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '@/features/mobile/mobileUxSpec';
import { mobileColors, mobileMetrics, mobileType } from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

function MessageBubble({ message }: { message: ChatMessage }): React.JSX.Element {
  const { isRTL } = useTheme();
  const isUser = message.role === 'user';
  // Explicit side control so it is correct regardless of RN web RTL quirks: the user's own
  // messages sit on the trailing side, the agent's on the leading side.
  const justify = isUser
    ? isRTL
      ? 'flex-start'
      : 'flex-end'
    : isRTL
      ? 'flex-end'
      : 'flex-start';

  return (
    <View style={{ flexDirection: 'row', justifyContent: justify }}>
      <View
        style={{
          maxWidth: '80%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 16,
          backgroundColor: isUser ? mobileColors.primary : mobileColors.tile,
        }}
      >
        <Text
          style={{
            fontSize: mobileType.bodySize,
            lineHeight: 21,
            color: isUser ? mobileColors.onPrimary : mobileColors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export function SupportChatScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { rowDirection, isRTL } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(1);
  const inputRef = useRef('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'seed', role: 'agent', text: t('csupport.chat.seed') },
  ]);
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(0);

  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/support' as never);
    }
  };

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = useCallback((): void => {
    const text = inputRef.current.trim();
    if (text.length === 0) {
      return;
    }
    const userId = `m${idRef.current++}`;
    setMessages((prev) => [...prev, { id: userId, role: 'user', text }]);
    setDraft('');
    inputRef.current = '';
    scrollToEnd();
    // Canned, mock auto-reply (no backend, nothing is sent anywhere).
    const replyId = `m${idRef.current++}`;
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: replyId, role: 'agent', text: t('csupport.chat.autoReply') }]);
      scrollToEnd();
    }, 650);
  }, [scrollToEnd, t]);

  const onContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ): void => {
    setInputHeight(Math.min(120, Math.max(0, e.nativeEvent.contentSize.height)));
  };

  return (
    <KeyboardAvoidingView
      testID="support-chat-screen"
      style={{ flex: 1, backgroundColor: mobileColors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }}>
        <MobileSubHeader
          title={t('csupport.chat.title')}
          onBack={onBack}
          backLabel={t('mobile.back')}
          trailing={
            <View
              style={{
                width: mobileMetrics.headerButton,
                height: mobileMetrics.headerButton,
                borderRadius: mobileMetrics.headerButton / 2,
                backgroundColor: mobileColors.statusActiveSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="headset" size={18} color={mobileColors.statusActive} />
            </View>
          }
        />
        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: mobileColors.textSecondary,
            paddingHorizontal: mobileMetrics.screenPadding,
            textAlign: isRTL ? 'right' : 'left',
            marginBottom: 6,
          }}
        >
          {t('csupport.chat.online')}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: mobileMetrics.screenPadding,
          paddingVertical: 12,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToEnd}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'flex-end',
          gap: 10,
          paddingHorizontal: mobileMetrics.screenPadding,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: mobileColors.separator,
          backgroundColor: mobileColors.background,
        }}
      >
        <TextInput
          testID="support-chat-input"
          value={draft}
          onChangeText={(v) => {
            setDraft(v);
            inputRef.current = v;
          }}
          placeholder={t('csupport.chat.inputPlaceholder')}
          placeholderTextColor={mobileColors.mutedSoft}
          multiline
          onContentSizeChange={onContentSizeChange}
          style={{
            flex: 1,
            minHeight: 44,
            height: Math.max(44, inputHeight + 20),
            maxHeight: 120,
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderRadius: 22,
            backgroundColor: mobileColors.tile,
            fontSize: mobileType.bodySize,
            color: mobileColors.text,
            fontFamily: MOBILE_FONT_FAMILY,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
            ...NO_WEB_OUTLINE,
          }}
        />
        <PressableScale
          onPress={send}
          accessibilityLabel={t('csupport.chat.send')}
          testID="support-chat-send"
          pressScale={0.9}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: mobileColors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isRTL ? 'arrow-back' : 'arrow-forward'}
            size={20}
            color={mobileColors.onPrimary}
          />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}
