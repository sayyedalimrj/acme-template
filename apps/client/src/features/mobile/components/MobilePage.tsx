/**
 * MobilePage — in-frame scrollable page.
 *
 * A plain scrollable page used by the mobile screens. The app frame, soft desktop backdrop,
 * and the bottom tab bar are owned by `AppShell` (single source of layout), so this component
 * just renders an optional fixed header + a scroll area with safe-area handling. RTL-safe; RN
 * primitives only.
 */
import React, { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mobileColors } from '../mobileTokens';

export interface MobilePageProps {
  children: ReactNode;
  /** Fixed header rendered above the scroll area (optional). */
  header?: ReactNode;
  testID?: string;
  /** Extra bottom padding inside the scroll content. */
  scrollBottomPadding?: number;
}

export function MobilePage({
  children,
  header,
  testID,
  scrollBottomPadding = 28,
}: MobilePageProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: mobileColors.background }}>
      {header ? <View style={{ paddingTop: insets.top }}>{header}</View> : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: header ? 6 : insets.top + 6,
          paddingBottom: scrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
