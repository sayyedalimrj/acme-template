/**
 * AuthEntryScreen — first auth screen (mobile-first).
 *
 * One decision: the user enters ONLY their mobile number and continues to the OTP screen
 * (mock — nothing is sent). The password option is NOT shown here; it appears on the OTP
 * screen, and only for already-registered (known) accounts. New users never see it.
 *
 * No real network, SMS, or backend. See `authHelpers` / `authMockUsers`.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';

import { Text } from '@/components/ui';
import { isApiConfigured } from '@/config/api.config';
import { ACTIVE_PORTAL, ACTIVE_PORTAL_META } from '@/config/portal.config';
import { useT } from '@/i18n/I18nProvider';
import { requestOtp } from '@/services/authApi';

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
  const [submitting, setSubmitting] = useState(false);

  // Mobile-only sign in: the continue button stays disabled until a valid mobile is entered.
  const trimmedValue = value.trim();
  const canContinue = trimmedValue.length > 0 && isValidMobile(trimmedValue) && !submitting;

  const goToVerify = (mobile: string): void => {
    router.navigate({
      pathname: '/verify',
      params: { identifier: mobile, channel: 'mobile', portal: ACTIVE_PORTAL },
    } as unknown as Href);
  };

  const onContinue = async (): Promise<void> => {
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

    if (isApiConfigured) {
      // Real OTP: ask the backend to send the code via SMS (ippanel).
      try {
        setSubmitting(true);
        await requestOtp(trimmed, ACTIVE_PORTAL);
        setSubmitting(false);
        goToVerify(trimmed);
      } catch (e) {
        setSubmitting(false);
        setError(e instanceof Error ? e.message : 'ارسال کد ناموفق بود.');
      }
      return;
    }

    // Mock OTP "generation" — nothing is sent anywhere.
    sendOtpMock(trimmed, 'mobile');
    goToVerify(trimmed);
  };

  return (
    <AuthFrame
      testID="auth-entry-screen"
      iconName={ACTIVE_PORTAL_META.authIcon}
      title={ACTIVE_PORTAL === 'merchant' ? '' : ACTIVE_PORTAL_META.name}
      subtitle={ACTIVE_PORTAL === 'merchant' ? t('auth.entry.subtitle') : ACTIVE_PORTAL_META.loginSubtitle}
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
        onSubmitEditing={() => void onContinue()}
      />
      <AuthPrimaryButton
        testID="auth-entry-submit"
        label={t('auth.entry.continue')}
        onPress={() => void onContinue()}
        disabled={!canContinue}
      />
    </AuthFrame>
  );
}
