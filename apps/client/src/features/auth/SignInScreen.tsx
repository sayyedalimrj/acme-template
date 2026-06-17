/**
 * Sign-in screen (mock) — Ecme-style split auth with two sign-in methods.
 *
 * A segmented switch offers two UI-only paths:
 *  1. Password — "mobile or email" + password → mock sign-in (no validation, no backend).
 *  2. SMS code — mobile number → routes to the mock OTP screen (no SMS is ever sent).
 *
 * Nothing is validated, sent, or stored. On the password path the session boundary flips to
 * authenticated (mock) and the (auth) layout redirects into the app.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, FormField, Input, SegmentedControl, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

import { AuthScaffold } from './AuthScaffold';

type Method = 'password' | 'sms';

export function SignInScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const { signIn, status } = useSession();
  const router = useRouter();

  const [method, setMethod] = useState<Method>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const submitting = status === 'loading';

  const onPasswordSubmit = () => {
    // Mock only — no credential validation, no backend.
    void signIn({ email: identifier.trim() || undefined });
  };

  const onRequestCode = () => {
    // UI-only — no SMS is sent. Hand the (masked) mobile to the mock OTP screen.
    const target = mobile.trim();
    router.navigate({
      pathname: '/verify',
      params: target ? { mobile: target } : {},
    } as unknown as Href);
  };

  return (
    <AuthScaffold testID="sign-in-screen" heading={t('auth.welcome')} subheading={t('auth.subtitle')}>
      <Card elevation="md" padding="lg" contentStyle={{ gap: tokens.spacing.md }}>
        <SegmentedControl<Method>
          options={[
            { value: 'password', label: t('auth.method.password') },
            { value: 'sms', label: t('auth.method.sms') },
          ]}
          value={method}
          onChange={setMethod}
          stretch
        />

        {method === 'password' ? (
          <>
            <FormField label={t('auth.identifierLabel')}>
              <Input
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={t('auth.identifierPlaceholder')}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
                returnKeyType="next"
              />
            </FormField>
            <FormField label={t('auth.passwordLabel')}>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                autoCapitalize="none"
                secureTextEntry
                editable={!submitting}
                returnKeyType="go"
                onSubmitEditing={onPasswordSubmit}
              />
            </FormField>
            <Button
              label={submitting ? t('auth.signingIn') : t('auth.signInCta')}
              onPress={onPasswordSubmit}
              loading={submitting}
              size="md"
              style={{ marginTop: tokens.spacing.xs }}
            />
          </>
        ) : (
          <>
            <FormField label={t('auth.mobileLabel')}>
              <Input
                value={mobile}
                onChangeText={setMobile}
                placeholder={t('auth.mobilePlaceholder')}
                autoCapitalize="none"
                keyboardType="phone-pad"
                returnKeyType="go"
                onSubmitEditing={onRequestCode}
              />
            </FormField>
            <Button
              label={t('auth.sendCode')}
              onPress={onRequestCode}
              size="md"
              leading={<Ionicons name="chatbox-ellipses-outline" size={16} color={tokens.color.onPrimary} />}
              style={{ marginTop: tokens.spacing.xs }}
            />
            <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              {t('auth.smsHint')}
            </Text>
          </>
        )}

        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {t('auth.mockNote')}
        </Text>
      </Card>

      {/* Frontend-safe security reassurance (no credentials are ever requested here). */}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'flex-start',
          gap: tokens.spacing.xs,
          paddingHorizontal: tokens.spacing.xs,
        }}
      >
        <Ionicons
          name="lock-closed-outline"
          size={14}
          color={tokens.color.textMuted}
          style={{ marginTop: 2 }}
        />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>
          {t('auth.securityNote')}
        </Text>
      </View>
    </AuthScaffold>
  );
}
