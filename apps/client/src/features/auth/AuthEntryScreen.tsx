/**
 * AuthEntryScreen — first auth screen (mobile-first).
 *
 * Two ways in, chosen with a calm segmented toggle:
 *  - "Code login": enter a mobile/email, the app detects which and hands off to the OTP screen
 *    (mock — nothing is sent). New users continue to registration after verifying.
 *  - "Password login": already-registered users enter their mobile/email + password and sign in
 *    directly (mock credentials only — see authMockUsers).
 *
 * No real network, SMS, or backend. See `authHelpers` / `authMockUsers`.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';

import { AuthField } from './components/AuthField';
import { AuthFrame } from './components/AuthFrame';
import { AuthMethodToggle, type AuthMethod } from './components/AuthMethodToggle';
import { AuthPrimaryButton } from './components/AuthPrimaryButton';
import { authColors, authType } from './authTokens';
import { detectIdentifier, sendOtpMock } from './authHelpers';
import { verifyMockPassword } from './authMockUsers';

export function AuthEntryScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { signIn } = useSession();

  const [method, setMethod] = useState<AuthMethod>('code');
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const passwordRef = useRef<TextInput>(null);

  const trimmedValue = value.trim();
  const identifierValid = trimmedValue.length > 0 && detectIdentifier(trimmedValue) !== 'unknown';
  const canContinue =
    method === 'code' ? identifierValid : identifierValid && password.length > 0;

  const clearErrors = (): void => {
    if (error) setError(undefined);
    if (passwordError) setPasswordError(undefined);
  };

  const onContinueCode = (): void => {
    if (trimmedValue.length === 0) {
      setError(t('auth.entry.errorRequired'));
      return;
    }
    const channel = detectIdentifier(trimmedValue);
    if (channel === 'unknown') {
      setError(t('auth.entry.errorInvalid'));
      return;
    }
    setError(undefined);
    // Mock OTP "generation" — nothing is sent anywhere.
    sendOtpMock(trimmedValue, channel);
    router.navigate({
      pathname: '/verify',
      params: { identifier: trimmedValue, channel },
    } as unknown as Href);
  };

  const onSignInPassword = (): void => {
    if (trimmedValue.length === 0) {
      setError(t('auth.entry.errorRequired'));
      return;
    }
    if (detectIdentifier(trimmedValue) === 'unknown') {
      setError(t('auth.entry.errorInvalid'));
      return;
    }
    if (password.length === 0) {
      setPasswordError(t('auth.entry.passwordErrorRequired'));
      return;
    }
    const result = verifyMockPassword(trimmedValue, password);
    if (!result.ok) {
      setPasswordError(
        result.reason === 'unknown_user'
          ? t('auth.entry.passwordErrorUnknown')
          : t('auth.entry.passwordErrorWrong'),
      );
      return;
    }
    setError(undefined);
    setPasswordError(undefined);
    void signIn({ name: result.user.name, email: result.user.email });
  };

  const onSubmit = (): void => {
    if (method === 'code') {
      onContinueCode();
    } else {
      onSignInPassword();
    }
  };

  const helperKey =
    method === 'code' ? 'auth.entry.helper' : 'auth.entry.passwordDevHint';

  return (
    <AuthFrame
      testID="auth-entry-screen"
      iconName="storefront-outline"
      title=""
      subtitle={t('auth.entry.subtitle')}
      footer={
        <Text
          style={{
            fontSize: authType.helperSize,
            color: authColors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {t(helperKey)}
        </Text>
      }
    >
      <AuthMethodToggle
        value={method}
        onChange={(next) => {
          setMethod(next);
          clearErrors();
        }}
      />

      <AuthField
        testID="auth-entry-input"
        label={t('auth.entry.identifierLabel')}
        placeholder={t('auth.entry.identifierPlaceholder')}
        value={value}
        onChangeText={(next) => {
          setValue(next);
          clearErrors();
        }}
        error={error}
        keyboardType="email-address"
        forceLtrValue
        autoFocus
        returnKeyType={method === 'code' ? 'go' : 'next'}
        onSubmitEditing={() => {
          if (method === 'code') {
            onContinueCode();
          } else {
            passwordRef.current?.focus();
          }
        }}
      />

      {method === 'password' ? (
        <AuthField
          ref={passwordRef}
          testID="auth-entry-password"
          label={t('auth.passwordLabel')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            if (passwordError) setPasswordError(undefined);
          }}
          error={passwordError}
          secureTextEntry
          forceLtrValue
          returnKeyType="go"
          onSubmitEditing={onSignInPassword}
        />
      ) : null}

      <AuthPrimaryButton
        testID="auth-entry-submit"
        label={method === 'code' ? t('auth.entry.continue') : t('auth.entry.signIn')}
        onPress={onSubmit}
        disabled={!canContinue}
      />

      {method === 'password' ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: authType.helperSize, color: authColors.textSecondary }}>
            {t('auth.entry.noAccount')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMethod('code');
              clearErrors();
            }}
            testID="auth-entry-use-code"
          >
            <Text
              style={{ fontSize: authType.helperSize, fontWeight: '700', color: authColors.primary }}
            >
              {t('auth.entry.useCode')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </AuthFrame>
  );
}
