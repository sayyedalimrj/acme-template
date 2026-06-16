/**
 * Sign-in screen (mock).
 *
 * Ecme-style auth: a centered, elevated card on a soft admin background with a circular brand
 * logo, a strong "welcome" heading, a muted subtitle, and a clean form. Optional name/email,
 * then "Sign in to continue" — no password, nothing stored. On success the session boundary
 * flips to authenticated and the (auth) layout redirects into the app.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Button, Card, FormField, Input, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

export function SignInScreen(): React.JSX.Element {
  const { tokens, shadow } = useTheme();
  const t = useT();
  const { signIn, status } = useSession();
  const { width } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const submitting = status === 'loading';

  const onSubmit = () => {
    void signIn({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  const cardWidth = Math.min(440, width - tokens.spacing.lg * 2);

  return (
    <Screen
      scroll
      maxWidth={9999}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
    >
      <View style={{ width: cardWidth, gap: tokens.spacing.lg }}>
        {/* Brand + welcome header, centered above the card (Ecme auth rhythm). */}
        <View style={{ alignItems: 'center', gap: tokens.spacing.md }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadow('md'),
            }}
          >
            <Ionicons name="cart-outline" size={30} color={tokens.color.onPrimary} />
          </View>
          <View style={{ alignItems: 'center', gap: tokens.spacing.xs }}>
            <Text variant="display" style={{ textAlign: 'center' }}>
              {t('auth.welcome')}
            </Text>
            <Text tone="muted" style={{ textAlign: 'center', maxWidth: 360 }}>
              {t('auth.subtitle')}
            </Text>
          </View>
        </View>

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
            style={{ marginTop: tokens.spacing.xs }}
          />

          <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {t('auth.mockNote')}
          </Text>
        </Card>

        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {t('app.name')}
        </Text>
      </View>
    </Screen>
  );
}
