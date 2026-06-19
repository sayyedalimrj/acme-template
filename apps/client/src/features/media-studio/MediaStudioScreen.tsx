/**
 * AI Product Media Studio (index) — simplified to a single chat.
 *
 * The merchant either attaches a photo (a sample placeholder) or types a prompt, sends it, and
 * the studio replies with a mock "generated image" + a short note. The old multi-section flow
 * (provider status, product selector, source-quality analysis, task chooser, output grid, video
 * concepts) was removed in favour of this focused photo-or-prompt chat.
 *
 * SECURITY: MOCK-ONLY. No real AI/image/video provider, no external API, no file upload, no
 * product image sent anywhere, nothing published or applied to products (see security-model.md).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '@/features/mobile/mobileUxSpec';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { useMediaStudioChat, type StudioImage, type StudioMessage } from './useMediaStudioChat';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Sample images the merchant can "attach" (placeholders — no real upload). */
const ATTACH_SAMPLES: { color: string; icon: IoniconName }[] = [
  { color: '#456EFE', icon: 'shirt-outline' },
  { color: '#2BA770', icon: 'cafe-outline' },
  { color: '#D9971B', icon: 'bulb-outline' },
  { color: '#E5575B', icon: 'bag-handle-outline' },
];

function ImageTile({ image, size = 120 }: { image: StudioImage; size?: number }): React.JSX.Element {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        backgroundColor: image.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={image.icon} size={Math.round(size * 0.34)} color="#FFFFFF" />
    </View>
  );
}

function MessageRow({ message }: { message: StudioMessage }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const isUser = message.role === 'user';

  return (
    <View
      style={{
        flexDirection: rowDirection,
        gap: tokens.spacing.sm,
        alignItems: 'flex-end',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {isUser ? null : (
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
          <Ionicons name="color-wand" size={15} color={tokens.color.onPrimary} />
        </View>
      )}
      <View
        style={{
          maxWidth: '82%',
          gap: tokens.spacing.sm,
          padding: tokens.spacing.sm,
          borderRadius: tokens.radius.lg,
          backgroundColor: isUser ? tokens.color.primary : tokens.color.surfaceAlt,
          borderTopStartRadius: isUser ? tokens.radius.lg : tokens.radius.sm,
          borderTopEndRadius: isUser ? tokens.radius.sm : tokens.radius.lg,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {message.image ? <ImageTile image={message.image} /> : null}
        {message.image && message.captionKey ? (
          <Text variant="caption" style={{ color: isUser ? tokens.color.onPrimary : tokens.color.textMuted }}>
            {t(message.captionKey)}
          </Text>
        ) : null}
        {message.text ? (
          <Text variant="body" style={{ color: isUser ? tokens.color.onPrimary : tokens.color.text }}>
            {message.text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function MediaStudioScreen(): React.JSX.Element {
  const { tokens, rowDirection, isRTL } = useTheme();
  const t = useT();
  const chat = useMediaStudioChat();

  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<StudioImage | null>(null);

  const canSend = !chat.sending && (draft.trim().length > 0 || pendingImage !== null);

  const onSend = (): void => {
    if (!canSend) return;
    chat.send(
      { text: draft.trim() || undefined, image: pendingImage ?? undefined },
      (hadImage) => t(hadImage ? 'mediaStudio.chat.replyImage' : 'mediaStudio.chat.reply'),
    );
    setDraft('');
    setPendingImage(null);
    setAttachOpen(false);
  };

  return (
    <Screen
      testID="media-studio-screen"
      title={t('mediaStudio.title')}
      headerRight={
        chat.messages.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mediaStudio.chat.newChat')}
            testID="studio-new-chat"
            onPress={chat.reset}
            style={({ pressed }) => ({
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.primarySoft,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="add" size={16} color={tokens.color.primary} />
            <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>
              {t('mediaStudio.chat.newChat')}
            </Text>
          </Pressable>
        ) : undefined
      }
    >
      <SecurityNote messageKey="mediaStudio.safety.note" />

      <Card>
        {chat.messages.length === 0 ? (
          <View style={{ alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: tokens.color.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="color-wand-outline" size={28} color={tokens.color.primary} />
            </View>
            <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
              {t('mediaStudio.chat.intro')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: tokens.spacing.md }} testID="studio-thread">
            {chat.messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
            {chat.sending ? (
              <View
                style={{
                  flexDirection: rowDirection,
                  gap: tokens.spacing.sm,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
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
                  <Ionicons name="color-wand" size={15} color={tokens.color.onPrimary} />
                </View>
                <Text variant="caption" tone="muted">
                  {t('mediaStudio.chat.sending')}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Attach panel */}
        {attachOpen ? (
          <View style={{ gap: tokens.spacing.sm }}>
            <Text variant="caption" tone="muted">
              {t('mediaStudio.chat.attachTitle')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: tokens.spacing.sm, flexDirection: rowDirection }}
            >
              {ATTACH_SAMPLES.map((sample, index) => {
                const active =
                  pendingImage?.color === sample.color && pendingImage?.icon === sample.icon;
                return (
                  <Pressable
                    key={index}
                    accessibilityRole="button"
                    testID={`studio-attach-${index}`}
                    onPress={() => setPendingImage(sample)}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: sample.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: active ? 3 : 0,
                      borderColor: tokens.color.text,
                      opacity: active ? 1 : 0.85,
                    }}
                  >
                    <Ionicons name={sample.icon} size={22} color="#FFFFFF" />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Composer */}
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, alignItems: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mediaStudio.chat.attach')}
            testID="studio-attach-toggle"
            onPress={() => setAttachOpen((v) => !v)}
            style={{
              width: 48,
              height: 48,
              borderRadius: tokens.radius.md,
              backgroundColor: pendingImage ? tokens.color.primarySoft : tokens.color.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={pendingImage ? 'image' : 'image-outline'}
              size={20}
              color={pendingImage ? tokens.color.primary : tokens.color.textMuted}
            />
          </Pressable>

          <View
            style={{
              flex: 1,
              minHeight: 48,
              justifyContent: 'center',
              paddingHorizontal: 14,
              borderRadius: tokens.radius.md,
              backgroundColor: tokens.color.surfaceAlt,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('mediaStudio.chat.placeholder')}
              placeholderTextColor={tokens.color.textPlaceholder}
              editable={!chat.sending}
              onSubmitEditing={onSend}
              returnKeyType="send"
              style={{
                fontSize: 14,
                color: tokens.color.text,
                fontFamily: MOBILE_FONT_FAMILY,
                paddingVertical: 12,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
                ...NO_WEB_OUTLINE,
              }}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mediaStudio.chat.send')}
            accessibilityState={{ disabled: !canSend }}
            testID="studio-send"
            disabled={!canSend}
            onPress={onSend}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: tokens.radius.md,
              backgroundColor: !canSend
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
              color={!canSend ? tokens.color.textPlaceholder : tokens.color.onPrimary}
            />
          </Pressable>
        </View>

        {pendingImage ? (
          <Text variant="caption" tone="primary">
            {t('mediaStudio.chat.attached')}
          </Text>
        ) : null}

        <Text variant="caption" tone="muted">
          {t('mediaStudio.chat.disclaimer')}
        </Text>
      </Card>
    </Screen>
  );
}
