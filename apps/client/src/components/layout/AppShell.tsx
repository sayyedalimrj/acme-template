/**
 * AppShell: the authenticated layout chrome — a single, mobile-first app frame.
 *
 * One layout everywhere (no competing desktop sidebar + mobile frame): the merchant app is a
 * mobile-first experience, so on wide/desktop viewports we CENTER one mobile frame on a soft
 * gray backdrop, and on phones it is full-bleed. The bottom tab bar lives inside the frame.
 * Each screen renders its own header (via MobilePage) — there is no global top bar. Built from
 * RN primitives only; horizontal overflow is avoided by the fixed-max-width frame.
 */
import React, { type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { BottomNav } from '@/features/mobile/components';
import { mobileMetrics, useMobileColors, useMobileFrameShadow } from '@/features/mobile/mobileTokens';

/** At/above this width we render the centered desktop frame. */
export const WIDE_BREAKPOINT = mobileMetrics.desktopBreakpoint;

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const colors = useMobileColors();
  const frameShadow = useMobileFrameShadow();
  const { width } = useWindowDimensions();
  const wide = width >= mobileMetrics.desktopBreakpoint;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: wide ? colors.pageBackdrop : colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        // Clip so the page itself never scrolls (esp. on large iPad/desktop viewports): only the
        // inner page ScrollView scrolls; the centered frame stays put.
        overflow: 'hidden',
        // Vertical breathing room on wide screens lives on the parent (padding, not child
        // margin) so the frame can't push the layout taller than the viewport.
        paddingVertical: wide ? 24 : 0,
      }}
    >
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            maxWidth: mobileMetrics.frameMaxWidth,
            backgroundColor: colors.background,
            overflow: 'hidden',
          },
          wide
            ? {
                borderRadius: mobileMetrics.frameRadius,
                borderWidth: 1,
                borderColor: colors.frameBorder,
                ...frameShadow,
              }
            : null,
        ]}
      >
        <View style={{ flex: 1 }}>{children}</View>
        <BottomNav />
      </View>
    </View>
  );
}
