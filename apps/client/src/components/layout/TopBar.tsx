/**
 * TopBar.
 *
 * Shows the brand (on narrow layouts), the active-site indicator, a theme toggle, a compact
 * account indicator, and a sign-out action.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

import { ActiveSiteIndicator } from './ActiveSiteIndicator';

export interface TopBarProps {
  /** Show the brand label (used on narrow layouts where there is no sidebar). */
  showBrand?: boolean;
}

export function TopBar({ showBrand = false }: TopBarProps): React.JSX.Element {
  const { tokens, rowDirection, mode, toggleMode } = useTheme();
  const t = useT();
  const { user, signOut } = useSession();

  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        height: 64,
        paddingHorizontal: tokens.spacing.lg,
        backgroundColor: tokens.color.chrome,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: tokens.color.border,
      }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          flex: 1,
        }}
      >
        {showBrand ? <Ionicons name="cart-outline" size={20} color={tokens.color.primary} /> : null}
        <ActiveSiteIndicator compact />
      </View>

      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          onPress={toggleMode}
          hitSlop={8}
        >
          <Ionicons
            name={mode === 'light' ? 'moon-outline' : 'sunny-outline'}
            size={20}
            color={tokens.color.textMuted}
          />
        </Pressable>

        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text variant="label" numberOfLines={1}>
            {user ? user.name : t('topbar.account')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('topbar.signOut')}
          onPress={() => {
            void signOut();
          }}
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={20} color={tokens.color.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}
