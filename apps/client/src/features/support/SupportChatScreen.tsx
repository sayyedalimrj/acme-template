/**
 * SupportChatScreen — the merchant-facing support messenger.
 *
 * A conversation thread with message bubbles (RTL-correct), an agent header, and a sticky
 * compose bar. The thread is served by the `SupportMessagingAdapter` via `useSupportChat`
 * (mock today). Sending a message appends it and returns a canned agent reply. This is the
 * client side of the bridge to the internal admin support inbox: a future `http` adapter posts
 * and reads through OUR backend so the same conversation is mirrored in `apps/admin` — this
 * screen stays unchanged. MOCK-ONLY: nothing is sent to any external provider.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { mobileMetrics, mobileType, useMobileColors } from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { SupportChatMessage } from '@/domain/types';

import { useSendSupportMessage, useSupportConversation } from './useSupportChat';

function MessageBubble({ message }: { message: SupportChatMessage }): React.JSX.Element {
  const colors = useMobileColors();
  const { isRTL } = useTheme();
  const isUser = message.author === 'customer';
  // Explicit side control so it is correct regardless of RN web RTL quirks: the user's own
  // messages sit on the trailing side, the agent/system on the leading side.
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
          backgroundColor: isUser ? colors.primary : colors.tile,
        }}
      >
        <Text
          style={{
            fontSize: mobileType.bodySize,
            lineHeight: 21,
            color: isUser ? colors.onPrimary : colors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {message.body}
        </Text>
      </View>
    </View>
  );
}

export function SupportChatScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const t = useT();
  const router = useRouter();
  const { rowDirection, isRTL } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const conversationQuery = useSupportConversation();
  const sendMutation = useSendSupportMessage();

  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(0);

  const messages = conversationQuery.data?.messages ?? [];
  const messageCount = messages.length;

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

  useEffect(() => {
    scrollToEnd();
  }, [messageCount, scrollToEnd]);

  const send = useCallback((): void => {
    const text = draft.trim();
    if (text.length === 0 || sendMutation.isPending) {
      return;
    }
    setDraft('');
    sendMutation.mutate(text);
  }, [draft, sendMutation]);

  const onContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ): void => {
    setInputHeight(Math.min(120, Math.max(0, e.nativeEvent.contentSize.height)));
  };

  return (
    <KeyboardAvoidingView
      testID="support-chat-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
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
                backgroundColor: colors.statusActiveSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="headset" size={18} color={colors.statusActive} />
            </View>
          }
        />
        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: colors.textSecondary,
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
          borderTopColor: colors.separator,
          backgroundColor: colors.background,
        }}
      >
        <TextInput
          testID="support-chat-input"
          value={draft}
          onChangeText={setDraft}
          placeholder={t('csupport.chat.inputPlaceholder')}
          placeholderTextColor={colors.mutedSoft}
          multiline
          onContentSizeChange={onContentSizeChange}
          onSubmitEditing={send}
          style={{
            flex: 1,
            minHeight: 44,
            height: Math.max(44, inputHeight + 20),
            maxHeight: 120,
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderRadius: 22,
            backgroundColor: colors.tile,
            fontSize: mobileType.bodySize,
            color: colors.text,
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
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isRTL ? 'arrow-back' : 'arrow-forward'}
            size={20}
            color={colors.onPrimary}
          />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}
