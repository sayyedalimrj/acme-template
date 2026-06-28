/**
 * AdminShell — the internal admin chrome: a top bar with the app identity, two primary
 * destinations (Overview, Workflows), and a locale toggle. Internal-only; no merchant nav.
 */
import { usePathname, useRouter, type Href } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useLocale, useT, useTheme } from '@/system';
import { Text } from '@/ui';

function NavLink({ label, href, active }: { label: string; href: string; active: boolean }): React.JSX.Element {
  const { tokens } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      onPress={() => router.navigate(href as Href)}
      style={{
        paddingVertical: tokens.spacing.xs + 2,
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        backgroundColor: active ? tokens.color.primarySoft : 'transparent',
      }}
    >
      <Text variant="label" tone={active ? 'primary' : 'muted'} style={{ fontWeight: active ? '700' : '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AdminShell({ children }: { children: ReactNode }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();

  const isWorkflows = pathname.startsWith('/workflows');
  const isSupport = pathname.startsWith('/support');
  const isOnboarding = pathname.startsWith('/onboarding');
  const isOverview = !isWorkflows && !isSupport && !isOnboarding;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.md,
          height: 60,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: tokens.color.chrome,
          borderBottomWidth: tokens.borderWidth.hairline,
          borderBottomColor: tokens.color.border,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: tokens.radius.sm,
            backgroundColor: tokens.color.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="label" tone="onPrimary" style={{ fontWeight: '800' }}>
            A
          </Text>
        </View>
        <Text variant="subheading" numberOfLines={1} style={{ fontWeight: '700' }}>
          {t('app.name')}
        </Text>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, marginHorizontal: tokens.spacing.md }}>
          <NavLink label={t('nav.overview')} href="/" active={isOverview} />
          <NavLink label={t('nav.onboarding')} href="/onboarding" active={isOnboarding} />
          <NavLink label={t('nav.workflows')} href="/workflows" active={isWorkflows} />
          <NavLink label={t('nav.support')} href="/support" active={isSupport} />
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle language"
          onPress={() => setLocale(locale === 'fa' ? 'en' : 'fa')}
          style={{
            paddingVertical: tokens.spacing.xs,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: tokens.radius.pill,
            borderWidth: tokens.borderWidth.hairline,
            borderColor: tokens.color.border,
          }}
        >
          <Text variant="caption" tone="muted">
            {locale === 'fa' ? 'EN' : 'فا'}
          </Text>
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
