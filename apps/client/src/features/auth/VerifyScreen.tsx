/**
 * Verification screen (MOCK / UI-ONLY) — Ecme-style auth.
 *
 * A polished OTP/verification layout (shares AuthScaffold's split layout with sign-in). It is
 * deliberately non-functional:
 *  - No code is sent, generated, stored, or validated.
 *  - "Resend" is disabled (nothing is delivered).
 *  - "Verify" is a mock action (it never authenticates or contacts a backend).
 *  - Only the locally-typed digits live in component state; nothing is persisted.
 *
 * Real OTP generation/delivery/validation and auth state arrive later behind the
 * AuthService/adapter boundary and a security review.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { Button, Card, MockActionButton, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { AuthScaffold } from './AuthScaffold';

const CODE_LENGTH = 6;

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
      style={{
        flexDirection: 'row',
        gap: tokens.spacing.sm,
        justifyContent: 'space-between',
      }}
      accessibilityLabel={`${CODE_LENGTH}-digit verification code`}
    >
      {Array.from({ length: CODE_LENGTH }).map((_, index) => {
        const focused = focusedIndex === index;
        const filled = Boolean(digits[index]);
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
              flex: 1,
              height: 58,
              textAlign: 'center',
              writingDirection: 'ltr',
              fontSize: tokens.typography.title.fontSize,
              fontWeight: '700',
              color: tokens.color.text,
              backgroundColor: focused ? tokens.color.surface : tokens.color.surfaceAlt,
              borderRadius: tokens.radius.md,
              borderWidth: focused || filled ? tokens.borderWidth.thick : tokens.borderWidth.thin,
              borderColor: focused
                ? tokens.color.focusRing
                : filled
                  ? tokens.color.primary
                  : tokens.color.border,
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

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));

  const goToSignIn = () => router.replace('/sign-in' as Href);

  return (
    <AuthScaffold testID="verify-screen" heading={t('verify.title')} subheading={t('verify.subtitle')}>
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
    </AuthScaffold>
  );
}
