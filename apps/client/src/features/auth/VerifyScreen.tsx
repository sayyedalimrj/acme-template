/**
 * Verification screen (MOCK / UI-ONLY) — Ecme-style auth.
 *
 * A polished OTP/verification layout that demonstrates the verification step of a future
 * real auth flow. It is deliberately non-functional:
 *  - No code is sent, generated, stored, or validated.
 *  - "Resend" is disabled (nothing is delivered).
 *  - "Verify" is a mock action (it never authenticates or contacts a backend).
 *  - Only the locally-typed digits live in component state; nothing is persisted.
 *
 * It mirrors the sign-in split layout (brand panel + centered card) and is fully RTL/LTR and
 * dark-mode safe via theme tokens. Real OTP generation/delivery/validation and auth state
 * arrive later behind the AuthService/adapter boundary and a security review.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, MockActionButton, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

const CODE_LENGTH = 6;

function BrandPanel(): React.JSX.Element {
  const { tokens, shadow } = useTheme();
  const t = useT();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: tokens.color.primary,
          borderRadius: tokens.radius.xl + 8,
          padding: tokens.spacing.xxl,
          justifyContent: 'center',
          gap: tokens.spacing.xl,
        },
        shadow('md'),
      ]}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: tokens.radius.lg,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="shield-checkmark-outline" size={38} color={tokens.color.onPrimary} />
      </View>
      <View style={{ gap: tokens.spacing.md }}>
        <Text variant="display" tone="onPrimary" style={{ fontWeight: '700' }}>
          {t('verify.title')}
        </Text>
        <Text tone="onPrimary" style={{ opacity: 0.85, maxWidth: 460 }}>
          {t('verify.subtitle')}
        </Text>
      </View>
    </View>
  );
}

/** A row of single-digit code boxes (UI-only). */
function CodeInput({
  digits,
  onChange,
}: {
  digits: string[];
  onChange: (next: string[]) => void;
}): React.JSX.Element {
  const { tokens } = useTheme();
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const setDigit = (index: number, value: string) => {
    // Keep only the last typed digit; ignore non-numeric characters.
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    onChange(next);
    if (sanitized && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    // OTP digits always read left-to-right, even in the RTL (Persian) app — this mirrors
    // Ecme's OtpVerificationForm which wraps the OTP field in dir="ltr".
    <View
      style={{ flexDirection: 'row', gap: tokens.spacing.sm, justifyContent: 'center' }}
      accessibilityLabel={`${CODE_LENGTH}-digit verification code`}
    >
      {Array.from({ length: CODE_LENGTH }).map((_, index) => {
        const focused = focusedIndex === index;
        return (
          <TextInput
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digits[index] ?? ''}
            onChangeText={(value) => setDigit(index, value)}
            onKeyPress={(e) => onKeyPress(index, e)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((prev) => (prev === index ? null : prev))}
            keyboardType="number-pad"
            maxLength={1}
            returnKeyType="next"
            accessibilityLabel={`Digit ${index + 1}`}
            placeholderTextColor={tokens.color.textPlaceholder}
            style={{
              width: 46,
              height: 58,
              textAlign: 'center',
              writingDirection: 'ltr',
              fontSize: tokens.typography.title.fontSize,
              fontWeight: '700',
              color: tokens.color.text,
              backgroundColor: tokens.color.surface,
              borderRadius: tokens.radius.md,
              borderWidth: focused ? tokens.borderWidth.thick : tokens.borderWidth.thin,
              borderColor: focused ? tokens.color.focusRing : tokens.color.border,
            }}
          />
        );
      })}
    </View>
  );
}

export function VerifyScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 920;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));

  const goToSignIn = () => router.replace('/sign-in' as Href);

  const formColumn = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '100%', maxWidth: 420, gap: tokens.spacing.lg }}>
        <View style={{ gap: tokens.spacing.xs }}>
          {!wide ? (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: tokens.radius.lg,
                backgroundColor: tokens.color.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: tokens.spacing.sm,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={30} color={tokens.color.onPrimary} />
            </View>
          ) : null}
          <Text variant="display" style={{ fontWeight: '700' }}>
            {t('verify.title')}
          </Text>
          <Text tone="muted">{t('verify.subtitle')}</Text>
        </View>

        <Card elevation="md" padding="lg" contentStyle={{ gap: tokens.spacing.md }}>
          <Text variant="label" tone="muted">
            {t('verify.codeLabel')}
          </Text>
          <CodeInput digits={digits} onChange={setDigits} />

          {/* Verify is a mock action — it never validates a code or authenticates. */}
          <MockActionButton
            label={t('verify.verifyCta')}
            note={t('verify.verifyHint')}
            variant="primary"
            size="md"
            style={{ alignSelf: 'stretch', marginTop: tokens.spacing.xs }}
          />

          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'center',
              gap: tokens.spacing.xs,
              flexWrap: 'wrap',
            }}
          >
            <Text variant="caption" tone="muted">
              {t('verify.help')}
            </Text>
            {/* Resend is intentionally disabled in this mock — nothing is delivered. */}
            <Button label={t('verify.resend')} variant="ghost" size="sm" disabled />
          </View>

          <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {t('verify.mockNote')}
          </Text>
        </Card>

        <View style={{ alignItems: 'center' }}>
          <Button
            label={t('verify.back')}
            variant="ghost"
            size="sm"
            onPress={goToSignIn}
            leading={<Ionicons name="arrow-back" size={16} color={tokens.color.primary} />}
          />
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      testID="verify-screen"
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: tokens.spacing.lg,
        paddingTop: tokens.spacing.lg + insets.top,
        paddingBottom: tokens.spacing.lg + insets.bottom,
        flexDirection: wide ? rowDirection : 'column',
        gap: tokens.spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {wide ? <BrandPanel /> : null}
      {formColumn}
    </ScrollView>
  );
}
