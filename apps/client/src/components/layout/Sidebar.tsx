/**
 * Sidebar (web / wide layouts).
 *
 * Persistent vertical navigation with a brand header and the data-driven nav list. Shown on
 * wide viewports by the AppShell; narrow/native layouts use the MobileNav instead.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { NavLink } from './NavLink';
import { ActiveSiteIndicator } from './ActiveSiteIndicator';
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
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.lg,
        gap: tokens.spacing.lg,
      }}
    >
      {/* Brand */}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.sm,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: tokens.radius.md,
            backgroundColor: tokens.color.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="cart-outline" size={18} color={tokens.color.onPrimary} />
        </View>
        <Text variant="subheading" numberOfLines={2} style={{ flex: 1 }}>
          {t('app.name')}
        </Text>
      </View>

      {/* Active site context */}
      <ActiveSiteIndicator />

      {/* Section + nav */}
      <View style={{ gap: tokens.spacing.xs }}>
        <Text
          variant="caption"
          tone="muted"
          style={{
            paddingHorizontal: tokens.spacing.md,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {t('nav.sectionMain')}
        </Text>
        {navItems.map((item) => (
          <NavLink key={item.key} item={item} />
        ))}
      </View>
    </View>
  );
}
