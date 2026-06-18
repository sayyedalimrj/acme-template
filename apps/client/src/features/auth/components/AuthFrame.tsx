/**
 * AuthFrame — mobile-first layout shell for the auth flow.
 *
 * Renders a single, calm, centered "mobile app" frame: a circular brand icon, a bold title, a
 * muted subtitle, an optional masked target line, an optional circular back button, and the
 * screen body. Designed for 390–430px width first; on wide/desktop viewports it centers the
 * same frame (as a rounded card on a soft backdrop) instead of stretching the form. RTL/LTR
 * safe. Built only from RN primitives — no DOM, no web-only APIs.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { authColors, authMetrics, authType } from '../authTokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface AuthFrameProps {
  testID?: string;
  /** Brand icon shown in the circular badge. */
  iconName: IoniconName;
  title: string;
  subtitle: string;
  /** Optional masked identifier shown (LTR, bold) under the subtitle (OTP screen). */
  maskedTarget?: string;
  /** Show the circular back button in the header. */
  showBack?: boolean;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  /** Screen body (fields + CTA). */
  children: ReactNode;
  /** Optional footer area (helper text), kept visually separate from the body. */
  footer?: ReactNode;
}

export function AuthFrame({
  testID,
  iconName,
  title,
  subtitle,
  maskedTarget,
  showBack = false,
  onBack,
  backAccessibilityLabel,
  children,
  footer,
}: AuthFrameProps): React.JSX.Element {
  const { directional } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= authMetrics.desktopBreakpoint;

  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: wide ? authColors.pageBackdrop : authColors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wide ? authMetrics.screenPadding : 0,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          {
            width: '100%',
            maxWidth: authMetrics.frameMaxWidth,
            backgroundColor: authColors.background,
            paddingHorizontal: authMetrics.screenPadding,
            paddingTop: authMetrics.screenPadding + (showBack ? 0 : 16),
            paddingBottom: authMetrics.screenPadding,
          },
          wide
            ? {
                borderRadius: authMetrics.frameRadius,
                borderWidth: 1,
                borderColor: authColors.frameBorder,
                marginVertical: 24,
                // Soft elevation for the centered desktop card (RN-only shadow).
                shadowColor: '#23303B',
                shadowOpacity: 0.08,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 6,
              }
            : { flexGrow: 1 },
        ]}
      >
        {/* Header: optional back button + brand icon + title + subtitle. */}
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}
            onPress={onBack}
            style={({ pressed }) => ({
              width: authMetrics.backButtonSize,
              height: authMetrics.backButtonSize,
              borderRadius: authMetrics.backButtonSize / 2,
              backgroundColor: authColors.backButtonBackground,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: directional('flex-start', 'flex-end'),
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name={directional<IoniconName>('chevron-back', 'chevron-forward')}
              size={22}
              color={authColors.text}
            />
          </Pressable>
        ) : null}

        <View style={{ alignItems: 'center', gap: 14, marginTop: showBack ? 12 : 0 }}>
          <View
            style={{
              width: authMetrics.iconCircleSize,
              height: authMetrics.iconCircleSize,
              borderRadius: authMetrics.iconCircleSize / 2,
              backgroundColor: authColors.iconCircle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={iconName}
              size={authMetrics.iconGlyphSize}
              color={authColors.onPrimary}
            />
          </View>

          <Text
            style={{
              fontSize: authType.titleSize,
              fontWeight: authType.titleWeight,
              color: authColors.text,
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: authType.subtitleSize,
              color: authColors.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {subtitle}
          </Text>
          {maskedTarget ? (
            <Text
              style={{
                fontSize: authType.subtitleSize,
                fontWeight: '700',
                color: authColors.text,
                textAlign: 'center',
                writingDirection: 'ltr',
              }}
            >
              {maskedTarget}
            </Text>
          ) : null}
        </View>

        {/* Body */}
        <View style={{ marginTop: 28, gap: 18 }}>{children}</View>

        {/* Footer (helper text) pushed below the body, with breathing room. */}
        {footer ? <View style={{ marginTop: 20, alignItems: 'center' }}>{footer}</View> : null}

        {/* Spacer so the frame body sits comfortably on tall mobile screens. */}
        {!wide ? <View style={{ flexGrow: 1, minHeight: 12 }} /> : null}
      </View>
    </ScrollView>
  );
}
