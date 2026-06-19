/**
 * OtpVerificationScreen — mock 4-digit OTP step (mobile-first).
 *
 * Default: enter the 4-digit code. On verify:
 *  - a known mock user → establish a mock session (the auth layout redirects to the dashboard),
 *  - an unknown/new user → continue to the registration screen.
 *
 * For ALREADY-REGISTERED (known) numbers only, a secondary "sign in with password" option is
 * offered: it swaps the code boxes for a password field and signs in via `verifyMockPassword`.
 * New users never see the password option. UI-only: no code is sent/validated; demo code 1234,
 * demo password demo1234.
 */
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

import { AuthField } from './components/AuthField';
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
import { findMockUser, verifyMockPassword } from './authMockUsers';

import type { AppPortal } from '@/domain/types';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

/** Parse a portal route-param, defaulting safely to the merchant experience. */
function parsePortal(value: string): AppPortal {
  return value === 'admin' || value === 'affiliate' ? value : 'merchant';
}

type Mode = 'otp' | 'password';

export function OtpVerificationScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { rowDirection } = useTheme();
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ identifier?: string; channel?: string; portal?: string }>();

  const identifier = firstParam(params.identifier);
  const channelParam = firstParam(params.channel);
  const channel: IdentifierChannel | undefined =
    channelParam === 'email' || channelParam === 'mobile' ? channelParam : undefined;
  const portal = parsePortal(firstParam(params.portal));

  // Only already-registered numbers get the password-login option.
  const knownUser = findMockUser(identifier, channel);

  const [mode, setMode] = useState<Mode>('otp');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
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
    if (knownUser) {
      // Known mock user → mock session; the (auth) layout redirects to the chosen portal.
      void signIn({ name: knownUser.name, email: knownUser.email, portal });
      return;
    }
    // New user → continue to registration (carry the identifier + portal forward).
    router.replace({
      pathname: '/register',
      params: { identifier, channel: channel ?? '', portal },
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
    if (mode !== 'otp') {
      return;
    }
    if (complete) {
      submit();
    } else {
      submittedRef.current = false;
    }
    // We intentionally key only on completion so the auto-submit fires once when the code
    // becomes complete; `submit` reads the latest identifier/channel each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, mode]);

  const onResend = (): void => {
    // Mock only — regenerates the deterministic demo code; nothing is delivered.
    sendOtpMock(identifier, channel);
    setDigits(Array(OTP_LENGTH).fill(''));
    setResent(true);
  };

  const onPasswordSignIn = (): void => {
    if (password.length === 0) {
      setPasswordError(t('auth.password.errorRequired'));
      return;
    }
    const result = verifyMockPassword(identifier, password, channel);
    if (!result.ok) {
      setPasswordError(t('auth.password.errorWrong'));
      return;
    }
    setPasswordError(undefined);
    void signIn({ name: result.user.name, email: result.user.email, portal });
  };

  return (
    <AuthFrame
      testID="otp-screen"
      iconName={mode === 'password' ? 'lock-closed-outline' : 'shield-checkmark-outline'}
      title={mode === 'password' ? t('auth.password.title') : t('otp.title')}
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
          {mode === 'password' ? t('auth.password.devHint') : t('otp.devHint')}
        </Text>
      }
    >
      {mode === 'otp' ? (
        <>
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
                style={{
                  fontSize: authType.helperSize,
                  fontWeight: '700',
                  color: authColors.primary,
                }}
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

          {/* Password login — only for already-registered numbers. */}
          {knownUser ? (
            <Pressable
              accessibilityRole="button"
              testID="otp-use-password"
              onPress={() => {
                setMode('password');
                setError(undefined);
              }}
              style={{ alignItems: 'center', paddingTop: 4 }}
            >
              <Text
                style={{
                  fontSize: authType.helperSize,
                  fontWeight: '700',
                  color: authColors.primary,
                }}
              >
                {t('auth.password.option')}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <AuthField
            testID="otp-password-input"
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(next) => {
              setPassword(next);
              if (passwordError) {
                setPasswordError(undefined);
              }
            }}
            error={passwordError}
            secureTextEntry
            forceLtrValue
            autoFocus
            returnKeyType="go"
            onSubmitEditing={onPasswordSignIn}
          />
          <AuthPrimaryButton
            testID="otp-password-submit"
            label={t('auth.password.signIn')}
            onPress={onPasswordSignIn}
            disabled={password.length === 0}
          />
          <Pressable
            accessibilityRole="button"
            testID="otp-use-code"
            onPress={() => {
              setMode('otp');
              setPasswordError(undefined);
            }}
            style={{ alignItems: 'center', paddingTop: 4 }}
          >
            <Text
              style={{
                fontSize: authType.helperSize,
                fontWeight: '700',
                color: authColors.primary,
              }}
            >
              {t('auth.password.useCode')}
            </Text>
          </Pressable>
        </>
      )}
    </AuthFrame>
  );
}
