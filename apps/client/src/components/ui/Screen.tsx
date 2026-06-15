/**
 * Screen primitive.
 *
 * Standard page container: applies the themed background, safe-area insets, and an optional
 * scroll behavior with consistent content padding. Built from RN primitives only.
 */
import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** When true (default) content scrolls vertically. */
  scroll?: boolean;
  /** Apply default content padding. */
  padded?: boolean;
  contentStyle?: ViewStyle;
  testID?: string;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  contentStyle,
  testID,
}: ScreenProps): React.JSX.Element {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const padding = padded ? tokens.spacing.lg : 0;
  const innerStyle: ViewStyle = {
    padding,
    paddingBottom: padding + insets.bottom,
    gap: tokens.spacing.lg,
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: tokens.color.background,
  };

  if (scroll) {
    return (
      <ScrollView
        testID={testID}
        style={containerStyle}
        contentContainerStyle={StyleSheet.flatten([innerStyle, contentStyle])}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View testID={testID} style={StyleSheet.flatten([containerStyle, innerStyle, contentStyle])}>
      {children}
    </View>
  );
}
