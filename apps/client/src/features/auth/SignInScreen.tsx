/**
 * Sign-in screen (mock) — Ecme-style split auth.
 *
 * Wide web: a two-column split — a primary-colored brand panel (logo + tagline) beside a
 * centered form card. Narrow/mobile: the form card alone, centered. No password, no backend,
 * nothing stored. On success the session boundary flips to authenticated and the (auth)
 * layout redirects into the app.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, FormField, Input, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

function BrandPanel(): React.JSX.Element {
  const { tokens, shadow } = useTheme();
  const t = useT();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: tokens.color.primary,
          borderRadius: tokens.radius.xl + 8,
          padding: tokens.spacing.xxl,
          justifyContent: 'center',
          gap: tokens.spacing.xl,
        },
        shadow('md'),
      ]}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: tokens.radius.lg,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="cart-outline" size={38} color={tokens.color.onPrimary} />
      </View>
      <View style={{ gap: tokens.spacing.md }}>
        <Text variant="display" tone="onPrimary" style={{ fontWeight: '700' }}>
          {t('app.name')}
        </Text>
        <Text variant="heading" tone="onPrimary" style={{ opacity: 0.95 }}>
          {t('auth.tagline')}
        </Text>
        <Text tone="onPrimary" style={{ opacity: 0.8, maxWidth: 460 }}>
          {t('auth.taglineSub')}
        </Text>
      </View>
    </View>
  );
}

export function SignInScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { signIn, status } = useSession();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 920;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const submitting = status === 'loading';

  const onSubmit = () => {
    void signIn({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  const formColumn = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '100%', maxWidth: 420, gap: tokens.spacing.lg }}>
        <View style={{ gap: tokens.spacing.xs }}>
          {!wide ? (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: tokens.radius.lg,
                backgroundColor: tokens.color.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: tokens.spacing.sm,
              }}
            >
              <Ionicons name="cart-outline" size={30} color={tokens.color.onPrimary} />
            </View>
          ) : null}
          <Text variant="display" style={{ fontWeight: '700' }}>
            {t('auth.welcome')}
          </Text>
          <Text tone="muted">{t('auth.subtitle')}</Text>
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
      </View>
    </View>
  );

  return (
    <ScrollView
      testID="sign-in-screen"
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: tokens.spacing.lg,
        paddingTop: tokens.spacing.lg + insets.top,
        paddingBottom: tokens.spacing.lg + insets.bottom,
        flexDirection: wide ? rowDirection : 'column',
        gap: tokens.spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {wide ? <BrandPanel /> : null}
      {formColumn}
    </ScrollView>
  );
}
