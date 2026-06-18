/**
 * MobilePage — in-frame scrollable page with a fixed header.
 *
 * The optional header stays pinned above the scroll area (does not scroll with content).
 * Safe-area top inset is applied to the header only. RTL-safe; RN primitives only.
 */
import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.background }}>
      {header ? (
        <View
          style={{
            paddingTop: insets.top,
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
          paddingTop: header ? 8 : insets.top + 6,
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
