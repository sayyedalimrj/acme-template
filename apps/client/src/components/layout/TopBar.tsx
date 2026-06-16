/**
 * TopBar — Ecme-style header.
 *
 * Left: brand (narrow) + active-site indicator + a decorative search field (wide). Right: a
 * cluster of circular icon buttons (theme toggle, sign-out) and a user identity block,
 * separated by a hairline divider. 64px tall with a subtle bottom border + shadow.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

import { ActiveSiteIndicator } from './ActiveSiteIndicator';

export interface TopBarProps {
  /** Show the brand label (used on narrow layouts where there is no sidebar). */
  showBrand?: boolean;
}

export function TopBar({ showBrand = false }: TopBarProps): React.JSX.Element {
  const { tokens, rowDirection, mode, toggleMode, shadow } = useTheme();
  const t = useT();
  const { user, signOut } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  return (
    <View
      style={[
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.md,
          height: 64,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: tokens.color.chrome,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: tokens.color.border,
          zIndex: tokens.zIndex.sticky,
        },
        shadow('sm'),
      ]}
    >
      {/* Left: brand (narrow) + active site + decorative search (wide) */}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.md,
          flex: 1,
        }}
      >
        {showBrand ? <Ionicons name="cart-outline" size={20} color={tokens.color.primary} /> : null}
        <ActiveSiteIndicator compact />
        {wide ? (
          <View
            accessibilityElementsHidden
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: tokens.spacing.sm,
              backgroundColor: tokens.color.surfaceAlt,
              borderRadius: tokens.radius.pill,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: tokens.color.border,
              paddingVertical: tokens.spacing.xs + 1,
              paddingHorizontal: tokens.spacing.md,
              minWidth: 220,
            }}
          >
            <Ionicons name="search-outline" size={16} color={tokens.color.textMuted} />
            <Text variant="caption" tone="muted">
              {t('topbar.search')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Right: actions + user */}
      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
        <IconButton
          icon={mode === 'light' ? 'moon-outline' : 'sunny-outline'}
          accessibilityLabel={t('topbar.toggleTheme')}
          onPress={toggleMode}
        />
        <IconButton
          icon="log-out-outline"
          accessibilityLabel={t('topbar.signOut')}
          onPress={() => {
            void signOut();
          }}
        />

        {/* divider */}
        <View
          style={{
            width: StyleSheet.hairlineWidth,
            height: 28,
            backgroundColor: tokens.color.border,
            marginHorizontal: tokens.spacing.xs,
          }}
        />

        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="label" tone="primary" style={{ fontWeight: '700' }}>
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          {wide ? (
            <View>
              <Text variant="label" numberOfLines={1}>
                {user ? user.name : t('topbar.account')}
              </Text>
              {user?.email ? (
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
