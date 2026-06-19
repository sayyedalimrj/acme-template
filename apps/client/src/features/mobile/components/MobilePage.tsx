/**
 * MobilePage — in-frame scrollable page with a fixed header.
 *
 * The optional header stays pinned above the scroll area (does not scroll with content).
 * Safe-area top inset is applied to the header only. RTL-safe; RN primitives only.
 */
import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useMobileColors } from '../mobileTokens';

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
  const colors = useMobileColors();

  // The top safe-area inset is owned by the persistent GlobalHeader (rendered by the AppShell
  // above every screen), so screens no longer add it again here.
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.background }}>
      {header ? (
        <View
          style={{
            backgroundColor: colors.background,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.separator,
            zIndex: 10,
          }}
        >
          {header}
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: header ? 8 : 10,
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
