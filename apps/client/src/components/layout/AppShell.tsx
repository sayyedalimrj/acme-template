/**
 * AppShell: the authenticated layout chrome.
 *
 * Responsive and cross-platform:
 *  - Wide viewports (web): persistent Sidebar + TopBar + content area.
 *  - Narrow viewports / native: TopBar (with brand) + horizontal MobileNav + content.
 *
 * Breakpoint is derived from useWindowDimensions so it adapts on web resize and on device.
 * Built entirely from RN primitives; RTL is honored via the theme's row direction.
 */
import React, { type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { BottomNav } from '@/features/mobile/components';
import { useTheme } from '@/theme';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** At/above this width we show the persistent sidebar. */
export const WIDE_BREAKPOINT = 900;

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  if (isWide) {
    return (
      <View
        style={{ flex: 1, flexDirection: rowDirection, backgroundColor: tokens.color.background }}
      >
        <Sidebar />
        <View style={{ flex: 1 }}>
          <TopBar />
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    );
  }

  // Mobile / narrow: a clean app shell — content + bottom tab bar (no desktop sidebar/topbar).
  // Each mobile screen renders its own header via MobilePage/MobileHeader.
  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav />
    </View>
  );
}
