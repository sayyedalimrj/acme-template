/**
 * Sign-in screen (mock).
 *
 * A serious, minimal sign-in: optional name/email, then "Sign in to continue". There is no
 * password and nothing is stored — real authentication arrives later. On success the session
 * boundary flips to authenticated and the (auth) layout redirects into the app.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Button, Card, FormField, Input, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

export function SignInScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const { signIn, status } = useSession();
  const { width } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const submitting = status === 'loading';

  const onSubmit = () => {
    void signIn({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  return (
    <Screen scroll contentStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
      <Card style={{ width: '100%', maxWidth: Math.min(420, width - tokens.spacing.lg * 2) }}>
        <View
          style={{ alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: tokens.radius.md,
              backgroundColor: tokens.color.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="cart-outline" size={24} color={tokens.color.onPrimary} />
          </View>
          <Text variant="title">{t('app.name')}</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            {t('auth.subtitle')}
          </Text>
        </View>

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
          style={{ marginTop: tokens.spacing.xs }}
        />

        <Text
          variant="caption"
          tone="muted"
          style={{ textAlign: 'center', marginTop: tokens.spacing.xs }}
        >
          {t('auth.mockNote')}
        </Text>
      </Card>
    </Screen>
  );
}
