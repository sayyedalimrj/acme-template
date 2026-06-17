/**
 * Sidebar (web / wide layouts).
 *
 * Persistent vertical navigation: a branded logo header (aligned to the top-bar height with
 * a divider), the active-site card, a grouped, data-driven nav list. Ecme-style density and
 * surfaces. Shown on wide viewports by the AppShell; narrow/native layouts use the MobileNav.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SectionHeader, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { ActiveSiteIndicator } from './ActiveSiteIndicator';
import { NavLink } from './NavLink';
import { navSections, type NavSection } from './navigation';

export const SIDEBAR_WIDTH = 248;

/** True when the active pathname belongs to one of the section's routes. */
function sectionIsActive(section: NavSection, pathname: string): boolean {
  return section.items.some((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  );
}

/** A collapsible nav group. Open by default for workflow groups or the active group. */
function NavGroup({ section }: { section: NavSection }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const pathname = usePathname();
  const containsActive = sectionIsActive(section, pathname);
  const [open, setOpen] = useState(Boolean(section.defaultOpen) || containsActive);

  // Auto-open the group that owns the active route when navigation changes.
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <View style={{ gap: 2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={{ paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs }}
      >
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
          <SectionHeader label={t(section.labelKey)} style={{ flex: 1 }} />
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={14}
            color={tokens.color.textMuted}
          />
        </View>
      </Pressable>
      {open ? section.items.map((item) => <NavLink key={item.key} item={item} />) : null}
    </View>
  );
}

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

        {/* Collapsible workflow groups (Setup & Store Operations open by default). */}
        {navSections.map((section) => (
          <NavGroup key={section.key} section={section} />
        ))}
      </ScrollView>
    </View>
  );
}
