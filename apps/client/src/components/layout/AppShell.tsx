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
import { mobileColors, mobileFrameShadow, mobileMetrics } from '@/features/mobile/mobileTokens';

/** At/above this width we render the centered desktop frame. */
export const WIDE_BREAKPOINT = mobileMetrics.desktopBreakpoint;

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const wide = width >= mobileMetrics.desktopBreakpoint;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: wide ? mobileColors.pageBackdrop : mobileColors.background,
        alignItems: 'center',
      }}
    >
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            maxWidth: mobileMetrics.frameMaxWidth,
            backgroundColor: mobileColors.background,
            overflow: 'hidden',
          },
          wide
            ? {
                marginVertical: 24,
                borderRadius: mobileMetrics.frameRadius,
                borderWidth: 1,
                borderColor: mobileColors.frameBorder,
                ...mobileFrameShadow,
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
