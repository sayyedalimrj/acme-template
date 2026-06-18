/**
 * OtpVerificationScreen — mock 4-digit OTP step (mobile-first).
 *
 * Shows 4 OTP boxes, the masked target, a back button, and a mock "resend". On verify:
 *  - a known mock user → establish a mock session (the auth layout redirects to the dashboard),
 *  - an unknown/new user → continue to the registration screen.
 * UI-only: no code is sent or validated against any provider; the demo code is 1234.
 */
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

import { AuthFrame } from './components/AuthFrame';
import { AuthPrimaryButton } from './components/AuthPrimaryButton';
import { OtpBoxes } from './components/OtpBoxes';
import { authColors, authType } from './authTokens';
import {
  OTP_LENGTH,
  isOtpComplete,
  maskIdentifier,
  sendOtpMock,
  type IdentifierChannel,
} from './authHelpers';
import { findMockUser } from './authMockUsers';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function OtpVerificationScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { rowDirection } = useTheme();
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ identifier?: string; channel?: string }>();

  const identifier = firstParam(params.identifier);
  const channelParam = firstParam(params.channel);
  const channel: IdentifierChannel | undefined =
    channelParam === 'email' || channelParam === 'mobile' ? channelParam : undefined;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | undefined>();
  const [resent, setResent] = useState(false);
  // Guards against the auto-submit firing more than once for a single completed code.
  const submittedRef = useRef(false);

  const masked = identifier ? maskIdentifier(identifier, channel) : undefined;

  const goBack = (): void => {
    router.replace('/sign-in' as Href);
  };

  // Submit once per completed code. The ref guard means the auto-submit (effect) and a manual
  // tap on the verify button can never double-navigate / double-sign-in.
  const submit = (): void => {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    setError(undefined);
    const user = findMockUser(identifier, channel);
    if (user) {
      // Known mock user → mock session; the (auth) layout redirects to the dashboard.
      void signIn({ name: user.name, email: user.email });
      return;
    }
    // New user → continue to registration (carry the identifier forward).
    router.replace({
      pathname: '/register',
      params: { identifier, channel: channel ?? '' },
    } as unknown as Href);
  };

  const onVerify = (): void => {
    if (!isOtpComplete(digits)) {
      setError(t('otp.errorIncomplete'));
      return;
    }
    submit();
  };

  // Auto-submit as soon as all digits are entered (no extra tap needed); reset the guard if the
  // user clears/edits so a corrected code can submit again.
  const complete = isOtpComplete(digits);
  useEffect(() => {
    if (complete) {
      submit();
    } else {
      submittedRef.current = false;
    }
    // We intentionally key only on completion so the auto-submit fires once when the code
    // becomes complete; `submit` reads the latest identifier/channel each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const onResend = (): void => {
    // Mock only — regenerates the deterministic demo code; nothing is delivered.
    sendOtpMock(identifier, channel);
    setDigits(Array(OTP_LENGTH).fill(''));
    setResent(true);
  };

  return (
    <AuthFrame
      testID="otp-screen"
      iconName="shield-checkmark-outline"
      title={t('otp.title')}
      subtitle={t('otp.subtitle')}
      maskedTarget={masked}
      showBack
      onBack={goBack}
      backAccessibilityLabel={t('otp.back')}
      footer={
        <Text
          style={{
            fontSize: authType.helperSize,
            color: authColors.textSecondary,
            textAlign: 'center',
          }}
        >
          {t('otp.devHint')}
        </Text>
      }
    >
      <OtpBoxes
        digits={digits}
        error={Boolean(error)}
        onChange={(next) => {
          setDigits(next);
          if (error) {
            setError(undefined);
          }
        }}
      />
      {error ? (
        <Text
          style={{
            fontSize: authType.helperSize,
            color: authColors.danger,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
      ) : null}

      <AuthPrimaryButton testID="otp-submit" label={t('otp.verify')} onPress={onVerify} />

      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <Text style={{ fontSize: authType.helperSize, color: authColors.textSecondary }}>
          {t('otp.resendQuestion')}
        </Text>
        <Pressable accessibilityRole="button" onPress={onResend} testID="otp-resend">
          <Text
            style={{ fontSize: authType.helperSize, fontWeight: '700', color: authColors.primary }}
          >
            {t('otp.resendAction')}
          </Text>
        </Pressable>
      </View>
      {resent ? (
        <Text
          style={{
            fontSize: authType.helperSize,
            color: authColors.textSecondary,
            textAlign: 'center',
          }}
        >
          {t('otp.resent')}
        </Text>
      ) : null}
    </AuthFrame>
  );
}
