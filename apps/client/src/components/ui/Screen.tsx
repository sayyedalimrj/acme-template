/**
 * Screen primitive.
 *
 * Standard page container: applies the themed background, safe-area insets, and an optional
 * scroll behavior with consistent content padding. It can also render a sticky, mobile-style
 * header (a circular back button + title/subtitle + optional trailing slot) so every secondary
 * screen has a consistent header and a way back. Built from RN primitives only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** When true (default) content scrolls vertically. */
  scroll?: boolean;
  /** Apply default content padding. */
  padded?: boolean;
  /** Max content width on wide (desktop) viewports; content is centered. */
  maxWidth?: number;
  contentStyle?: ViewStyle;
  testID?: string;
  /** Sticky header title. When set, a header (with a back button by default) is rendered. */
  title?: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Show the back button next to the title. Defaults to true when a title is provided. */
  showBack?: boolean;
  /** Custom back handler. Defaults to router.back() (falling back to home). */
  onBack?: () => void;
  /** Optional trailing element rendered on the far side of the header. */
  headerRight?: ReactNode;
}

function ScreenHeader({
  title,
  subtitle,
  showBack,
  onBack,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  showBack: boolean;
  onBack?: () => void;
  headerRight?: ReactNode;
}): React.JSX.Element {
  const { tokens, rowDirection, directional, isRTL } = useTheme();
  const router = useRouter();

  const handleBack = (): void => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/' as never);
    }
  };

  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: tokens.spacing.sm,
        minHeight: 56,
        paddingHorizontal: tokens.spacing.lg,
        paddingVertical: tokens.spacing.sm,
        backgroundColor: tokens.color.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: tokens.color.border,
      }}
    >
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="screen-back"
          onPress={handleBack}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: tokens.radius.pill,
            backgroundColor: pressed ? tokens.color.border : tokens.color.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons
            name={directional('chevron-back', 'chevron-forward')}
            size={22}
            color={tokens.color.text}
          />
        </Pressable>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="heading" numberOfLines={1} style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="caption"
            tone="muted"
            numberOfLines={1}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {headerRight ?? null}
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  maxWidth = 1180,
  contentStyle,
  testID,
  title,
  subtitle,
  showBack,
  onBack,
  headerRight,
}: ScreenProps): React.JSX.Element {
  const { tokens } = useTheme();

  const hasHeader = Boolean(title);
  const resolvedShowBack = showBack ?? hasHeader;

  const padding = padded ? tokens.spacing.lg : 0;
  const innerStyle: ViewStyle = {
    padding,
    // The bottom safe-area inset is owned solely by the fixed bottom tab bar (rendered by the
    // shell as a sibling below this scroll area). Re-adding insets.bottom here double-counted the
    // home-indicator gap and left a blank strip; the base padding is enough to clear the content.
    paddingBottom: padding,
    gap: tokens.spacing.lg,
    // Desktop-admin rhythm: cap and center content on wide screens, full-width on mobile.
    width: '100%',
    maxWidth,
    alignSelf: 'center',
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: tokens.color.background,
  };

  // The top safe-area inset is owned by the persistent GlobalHeader (AppShell), so the
  // contextual back/title header here sits directly beneath it without re-insetting.
  const header = hasHeader ? (
    <View style={{ zIndex: 10, backgroundColor: tokens.color.background }}>
      <ScreenHeader
        title={title as string}
        subtitle={subtitle}
        showBack={resolvedShowBack}
        onBack={onBack}
        headerRight={headerRight}
      />
    </View>
  ) : null;

  if (scroll) {
    return (
      <View testID={testID} style={containerStyle}>
        {header}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={StyleSheet.flatten([
            innerStyle,
            hasHeader ? { paddingTop: tokens.spacing.sm } : null,
            contentStyle,
          ])}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View testID={testID} style={containerStyle}>
      {header}
      <View style={StyleSheet.flatten([{ flex: 1 }, innerStyle, contentStyle])}>{children}</View>
    </View>
  );
}
