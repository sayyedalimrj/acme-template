/**
 * MobilePage — mobile-first page shell.
 *
 * A scrollable page that is full-bleed on phones and a centered "mobile frame" on wide/desktop
 * viewports (the frame is centered, never stretched). Handles safe-area insets and an optional
 * fixed bottom navigation. RTL-safe; RN primitives only.
 */
import React, { type ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mobileColors, mobileMetrics } from '../mobileTokens';

export interface MobilePageProps {
  children: ReactNode;
  /** Fixed header rendered above the scroll area (optional). */
  header?: ReactNode;
  /** Fixed bottom navigation rendered below the scroll area (optional). */
  bottomNav?: ReactNode;
  testID?: string;
  /** Extra bottom padding inside the scroll content (e.g. when a bottom nav is present). */
  scrollBottomPadding?: number;
}

export function MobilePage({
  children,
  header,
  bottomNav,
  testID,
  scrollBottomPadding = 32,
}: MobilePageProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= mobileMetrics.desktopBreakpoint;

  return (
    <View
      testID={testID}
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
                marginVertical: 20,
                borderRadius: mobileMetrics.frameRadius,
                borderWidth: 1,
                borderColor: mobileColors.frameBorder,
              }
            : null,
        ]}
      >
        {header ? <View style={{ paddingTop: wide ? 14 : insets.top }}>{header}</View> : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: header ? 8 : wide ? 14 : insets.top + 8,
            paddingBottom: scrollBottomPadding,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {bottomNav}
      </View>
    </View>
  );
}
