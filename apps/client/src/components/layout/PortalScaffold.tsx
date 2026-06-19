/**
 * PortalScaffold — the shared mobile app frame used by every portal (merchant / admin /
 * affiliate).
 *
 * Identical chrome to the merchant `AppShell`: on wide/desktop viewports it CENTERS one mobile
 * frame on a soft backdrop; on phones it is full-bleed. A fixed top header and bottom tab bar
 * are passed in so each portal can supply its own. Built from RN primitives only; RTL-safe via
 * the shared design system.
 */
import React, { type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import {
  mobileMetrics,
  useMobileColors,
  useMobileFrameShadow,
} from '@/features/mobile/mobileTokens';

export interface PortalScaffoldProps {
  /** Fixed header rendered at the top of the frame. */
  header: ReactNode;
  /** Fixed bottom navigation rendered at the bottom of the frame. */
  bottomNav: ReactNode;
  children: ReactNode;
}

export function PortalScaffold({
  header,
  bottomNav,
  children,
}: PortalScaffoldProps): React.JSX.Element {
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
        overflow: 'hidden',
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
        {header}
        <View style={{ flex: 1 }}>{children}</View>
        {bottomNav}
      </View>
    </View>
  );
}
