/**
 * Sidebar (web / wide layouts).
 *
 * Persistent vertical navigation: a branded logo header (aligned to the top-bar height with
 * a divider), the active-site card, a grouped, data-driven nav list. Ecme-style density and
 * surfaces. Shown on wide viewports by the AppShell; narrow/native layouts use the MobileNav.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { ActiveSiteIndicator } from './ActiveSiteIndicator';
import { NavLink } from './NavLink';
import { navItems } from './navigation';

export const SIDEBAR_WIDTH = 280;

export function Sidebar(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();

  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        backgroundColor: tokens.color.chrome,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: tokens.color.border,
      }}
    >
      {/* Branded logo header — aligned to the top-bar height with a divider. */}
      <View
        style={{
          height: 64,
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: tokens.color.border,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radius.md,
            backgroundColor: tokens.color.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="cart-outline" size={20} color={tokens.color.onPrimary} />
        </View>
        <Text variant="subheading" numberOfLines={1} style={{ flex: 1, fontWeight: '700' }}>
          {t('app.name')}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.lg,
          gap: tokens.spacing.lg,
        }}
      >
        {/* Active site context */}
        <ActiveSiteIndicator />

        {/* Section + nav */}
        <View style={{ gap: tokens.spacing.xs }}>
          <Text
            variant="caption"
            tone="muted"
            style={{
              paddingHorizontal: tokens.spacing.sm,
              marginBottom: tokens.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontWeight: '600',
            }}
          >
            {t('nav.sectionMain')}
          </Text>
          {navItems.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </View>
      </View>
    </View>
  );
}
