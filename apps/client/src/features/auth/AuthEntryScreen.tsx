/**
 * AuthEntryScreen — first auth screen (mobile-first).
 *
 * One decision per screen: the user enters a mobile number OR an email; the app detects which
 * and hands off to the OTP screen. No password. A deterministic mock OTP is "generated"
 * (nothing is sent — no SMS, no email, no network). See `authHelpers`.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

import { AuthField } from './components/AuthField';
import { AuthFrame } from './components/AuthFrame';
import { AuthPrimaryButton } from './components/AuthPrimaryButton';
import { authColors, authType } from './authTokens';
import { isValidMobile, sendOtpMock } from './authHelpers';

export function AuthEntryScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  // Mobile-only sign in: the continue button stays disabled until a valid mobile is entered.
  const trimmedValue = value.trim();
  const canContinue = trimmedValue.length > 0 && isValidMobile(trimmedValue);

  const onContinue = (): void => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError(t('auth.entry.errorRequired'));
      return;
    }
    if (!isValidMobile(trimmed)) {
      setError(t('auth.entry.errorInvalid'));
      return;
    }
    setError(undefined);
    // Mock OTP "generation" — nothing is sent anywhere.
    sendOtpMock(trimmed, 'mobile');
    router.navigate({
      pathname: '/verify',
      params: { identifier: trimmed, channel: 'mobile' },
    } as unknown as Href);
  };

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
          {t('auth.entry.helper')}
        </Text>
      }
    >
      <AuthField
        testID="auth-entry-input"
        label={t('auth.entry.identifierLabel')}
        placeholder={t('auth.entry.identifierPlaceholder')}
        value={value}
        onChangeText={(next) => {
          setValue(next);
          if (error) {
            setError(undefined);
          }
        }}
        error={error}
        keyboardType="phone-pad"
        forceLtrValue
        autoFocus
        returnKeyType="go"
        onSubmitEditing={onContinue}
      />
      <AuthPrimaryButton
        testID="auth-entry-submit"
        label={t('auth.entry.continue')}
        onPress={onContinue}
        disabled={!canContinue}
      />
    </AuthFrame>
  );
}
