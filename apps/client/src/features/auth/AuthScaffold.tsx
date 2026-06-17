/**
 * AuthScaffold — shared Ecme-style split auth layout.
 *
 * Recreates Ecme's `AuthLayout/Split`: on wide web a two-column grid with a rounded
 * primary "brand" panel (illustration + headline) beside a centered form column; on
 * narrow/native, just the centered form column with a compact brand identity on top.
 *
 * The brand panel uses the Ecme auth illustration (a small, static PNG copied into the app
 * under assets/images/) layered over the primary surface with soft decorative shapes for a
 * gradient-like depth — built only from RN primitives (no gradient/web deps), so it stays
 * Web + Android + iOS compatible. RTL/LTR safe via the theme row direction.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { Image, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

// Static, RN-bundled asset (Metro resolves on web + native). Sourced from the Ecme template
// that ships in this repo (Theme/.../auth-split-img.png) — small (~56KB), static, no deps.
const AUTH_ILLUSTRATION = require('../../../assets/images/auth-split.png');

/** Wide-screen brand panel: illustration + headline on the primary surface. */
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
          paddingVertical: tokens.spacing.xxl,
          paddingHorizontal: tokens.spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing.xl,
          overflow: 'hidden',
        },
        shadow('md'),
      ]}
    >
      {/* Soft decorative shapes → gradient-like depth without a gradient dependency. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 280,
          height: 280,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -110,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />

      <Image
        source={AUTH_ILLUSTRATION}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
        style={{ width: '100%', maxWidth: 440, aspectRatio: 630 / 432 }}
      />
      <View style={{ alignItems: 'center', gap: tokens.spacing.md, maxWidth: 520 }}>
        <Text
          variant="display"
          tone="onPrimary"
          style={{ fontWeight: '700', textAlign: 'center' }}
        >
          {t('auth.tagline')}
        </Text>
        <Text tone="onPrimary" style={{ opacity: 0.82, textAlign: 'center', lineHeight: 24 }}>
          {t('auth.taglineSub')}
        </Text>
      </View>
    </View>
  );
}

export interface AuthScaffoldProps {
  /** Large form heading (e.g. "Welcome back"). */
  heading: string;
  /** Muted subheading under the form heading. */
  subheading: string;
  /** The form body (card + secondary actions). */
  children: ReactNode;
  testID?: string;
}

export function AuthScaffold({
  heading,
  subheading,
  children,
  testID,
}: AuthScaffoldProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 920;

  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: tokens.color.surface }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: tokens.spacing.lg,
        paddingTop: tokens.spacing.lg + insets.top,
        paddingBottom: tokens.spacing.lg + insets.bottom,
        flexDirection: wide ? rowDirection : 'column',
        gap: tokens.spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {wide ? (
        <View style={{ flex: 1 }}>
          <BrandPanel />
        </View>
      ) : null}

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '100%', maxWidth: 410, gap: tokens.spacing.lg }}>
          {/* Brand identity row (logo + app name) — Ecme places the mark above the form. */}
          <View
            style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: tokens.radius.md,
                backgroundColor: tokens.color.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="cart-outline" size={22} color={tokens.color.onPrimary} />
            </View>
            <Text variant="subheading" style={{ fontWeight: '700' }}>
              {t('app.name')}
            </Text>
          </View>

          <View style={{ gap: tokens.spacing.xs }}>
            <Text variant="display" style={{ fontWeight: '700' }}>
              {heading}
            </Text>
            <Text tone="muted">{subheading}</Text>
          </View>

          {children}
        </View>
      </View>
    </ScrollView>
  );
}
