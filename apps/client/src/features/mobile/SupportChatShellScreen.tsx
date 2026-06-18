/**
 * SupportChatShellScreen — a simple, mock support conversation.
 *
 * A calm chat shell: a scrollable message thread (support bubbles on the leading side, the
 * merchant's own messages on the trailing side) and a composer. Sending appends the merchant
 * message and a canned support auto-reply after a short delay. This is a SHELL ONLY — no real
 * chat backend, no provider, nothing is sent anywhere. Customer-friendly copy only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { MobilePage, MobileSubHeader, PressableScale } from './components';
import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from './mobileUxSpec';
import { mobileColors, mobileMetrics, mobileType } from './mobileTokens';

interface ChatMessage {
  id: string;
  from: 'support' | 'me';
  text: string;
}

export function SupportChatShellScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { rowDirection, isRTL } = useTheme();

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm0', from: 'support', text: t('support.chat.intro') },
  ]);

  const onBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/support' as never);
    }
  };

  const send = (): void => {
    const text = draft.trim();
    if (text.length === 0) {
      return;
    }
    const id = String(Date.now());
    setMessages((prev) => [...prev, { id, from: 'me', text }]);
    setDraft('');
    // Mock auto-reply (no backend, no provider).
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `${id}-r`, from: 'support', text: t('support.chat.autoReply') },
      ]);
    }, 600);
  };

  return (
    <MobilePage
      testID="support-chat-screen"
      header={
        <MobileSubHeader
          title={t('support.chat.title')}
          onBack={onBack}
          backLabel={t('mobile.back')}
        />
      }
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 12, paddingTop: 6 }}>
        {messages.map((message) => {
          const mine = message.from === 'me';
          return (
            <View
              key={message.id}
              style={{
                alignSelf: mine
                  ? isRTL
                    ? 'flex-start'
                    : 'flex-end'
                  : isRTL
                    ? 'flex-end'
                    : 'flex-start',
                maxWidth: '82%',
                backgroundColor: mine ? mobileColors.primary : mobileColors.tile,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  fontSize: mobileType.bodySize,
                  lineHeight: 21,
                  color: mine ? mobileColors.onPrimary : mobileColors.text,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {message.text}
              </Text>
            </View>
          );
        })}

        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: mobileColors.textSecondary,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          {t('support.chat.mockNote')}
        </Text>
      </View>

      {/* Composer */}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: mobileMetrics.screenPadding,
          paddingTop: 14,
        }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 48,
            justifyContent: 'center',
            backgroundColor: mobileColors.tile,
            borderRadius: 16,
            paddingHorizontal: 16,
          }}
        >
          <TextInput
            testID="support-chat-input"
            value={draft}
            onChangeText={setDraft}
            placeholder={t('support.chat.placeholder')}
            placeholderTextColor={mobileColors.mutedSoft}
            onSubmitEditing={send}
            returnKeyType="send"
            style={{
              fontSize: mobileType.bodySize,
              color: mobileColors.text,
              fontFamily: MOBILE_FONT_FAMILY,
              padding: 0,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
              ...NO_WEB_OUTLINE,
            }}
          />
        </View>
        <PressableScale
          onPress={send}
          accessibilityLabel={t('support.chat.send')}
          testID="support-chat-send"
          pressScale={0.92}
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
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
    </MobilePage>
  );
}
