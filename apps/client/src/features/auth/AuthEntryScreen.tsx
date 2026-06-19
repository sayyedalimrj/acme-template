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
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import type { AppPortal } from '@/domain/types';

import { AuthField } from './components/AuthField';
import { AuthFrame } from './components/AuthFrame';
import { AuthPrimaryButton } from './components/AuthPrimaryButton';
import { authColors, authType } from './authTokens';
import { isValidMobile, sendOtpMock } from './authHelpers';

/** The three sign-in experiences offered on the demo entry screen (frontend-safe only). */
const PORTAL_OPTIONS: readonly { value: AppPortal; label: string }[] = [
  { value: 'merchant', label: 'فروشنده' },
  { value: 'admin', label: 'مدیریت' },
  { value: 'affiliate', label: 'بازاریاب' },
];

/** Compact 3-way selector that lets the demo user pick which portal to sign into. */
function PortalChoice({
  value,
  onChange,
}: {
  value: AppPortal;
  onChange: (next: AppPortal) => void;
}): React.JSX.Element {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: authType.labelSize,
          fontWeight: authType.labelWeight,
          color: authColors.text,
          textAlign: 'right',
        }}
      >
        ورود به
      </Text>
      <View
        style={{
          flexDirection: 'row-reverse',
          backgroundColor: authColors.inputBackground,
          borderRadius: authType.labelSize,
          padding: 4,
          gap: 4,
        }}
      >
        {PORTAL_OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
              testID={`auth-portal-${option.value}`}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? authColors.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: authType.helperSize,
                  fontWeight: '700',
                  color: active ? authColors.onPrimary : authColors.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AuthEntryScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [portal, setPortal] = useState<AppPortal>('merchant');
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
      params: { identifier: trimmed, channel: 'mobile', portal },
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
      <PortalChoice value={portal} onChange={setPortal} />
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
