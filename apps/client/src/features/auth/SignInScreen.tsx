/**
 * Sign-in screen (mock) — Ecme-style split auth.
 *
 * Wide web: a two-column split — an illustration brand panel beside a centered form column
 * (via AuthScaffold). Narrow/mobile: the form column alone. No password, no backend, nothing
 * stored. On success the session boundary flips to authenticated and the (auth) layout
 * redirects into the app.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, FormField, Input, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

import { AuthScaffold } from './AuthScaffold';

export function SignInScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const { signIn, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const submitting = status === 'loading';

  const onSubmit = () => {
    void signIn({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  return (
    <AuthScaffold
      testID="sign-in-screen"
      heading={t('auth.welcome')}
      subheading={t('auth.subtitle')}
    >
      <Card elevation="md" padding="lg" contentStyle={{ gap: tokens.spacing.md }}>
        <FormField label={t('auth.nameLabel')}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('auth.namePlaceholder')}
            autoCapitalize="words"
            editable={!submitting}
            returnKeyType="next"
          />
        </FormField>
        <FormField label={t('auth.emailLabel')}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!submitting}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        </FormField>
        <Button
          label={submitting ? t('auth.signingIn') : t('auth.signInCta')}
          onPress={onSubmit}
          loading={submitting}
          size="md"
          style={{ marginTop: tokens.spacing.xs }}
        />
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {t('auth.mockNote')}
        </Text>
      </Card>

      {/* Secondary action: a clearly mock verification step (UI-only OTP demo). */}
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
          {t('auth.haveCode')}
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate('/verify' as Href)}
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
        >
          <Text variant="caption" tone="primary" style={{ fontWeight: '600' }}>
            {t('auth.verifyLink')}
          </Text>
        </Pressable>
      </View>

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
