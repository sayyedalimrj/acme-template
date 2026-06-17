/**
 * Sidebar (web / wide layouts).
 *
 * Persistent vertical navigation: a branded logo header (aligned to the top-bar height with
 * a divider), the active-site card, a grouped, data-driven nav list. Ecme-style density and
 * surfaces. Shown on wide viewports by the AppShell; narrow/native layouts use the MobileNav.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SectionHeader, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { ActiveSiteIndicator } from './ActiveSiteIndicator';
import { NavLink } from './NavLink';
import { navSections } from './navigation';

export const SIDEBAR_WIDTH = 248;

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
      {/* Branded logo header — fixed, aligned to the top-bar height with a divider. */}
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

      {/* Scrollable nav/tools region — keeps every tool reachable when the list is long. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.md,
          gap: tokens.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active site context */}
        <ActiveSiteIndicator />

        {/* Grouped sections: Store Operations / Growth / Platform / System. */}
        {navSections.map((section) => (
          <View key={section.key} style={{ gap: 2 }}>
            <SectionHeader
              label={t(section.labelKey)}
              style={{ paddingHorizontal: tokens.spacing.sm, marginBottom: 2 }}
            />
            {section.items.map((item) => (
              <NavLink key={item.key} item={item} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
