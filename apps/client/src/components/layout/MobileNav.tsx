/**
 * MobileNav (narrow / native layouts) — placeholder.
 *
 * A horizontal, scrollable navigation strip shown under the TopBar on narrow viewports and
 * native platforms. This is an intentionally simple, cross-platform placeholder: a full
 * native navigation system (drawer/bottom-tabs) is a later task. It uses the same
 * data-driven nav model and RN primitives only.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { NavLink } from './NavLink';
import { navItems } from './navigation';

export function MobileNav(): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        backgroundColor: tokens.color.chrome,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: tokens.color.border,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: tokens.spacing.xs,
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
        }}
      >
        {navItems.map((item) => (
          <NavLink key={item.key} item={item} compact />
        ))}
      </ScrollView>
    </View>
  );
}
