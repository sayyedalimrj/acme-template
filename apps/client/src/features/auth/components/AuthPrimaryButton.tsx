/**
 * AuthPrimaryButton — the primary CTA for the auth flow.
 *
 * Matches the Figma reference: full-width, ~63px tall, rounded, brand blue, bold label, with
 * a clear pressed/disabled/loading state and a large touch target. RN-only.
 */
import React from 'react';
import { ActivityIndicator, Pressable, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';

import { authColors, authMetrics, authType } from '../authTokens';

export interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
}

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
  style,
}: AuthPrimaryButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: authMetrics.buttonHeight,
          borderRadius: authMetrics.buttonRadius,
          backgroundColor: isDisabled
            ? authColors.muted
            : pressed
              ? authColors.primaryPressed
              : authColors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={authColors.onPrimary} />
      ) : (
        <Text
          style={{
            fontSize: authType.buttonSize,
            fontWeight: authType.buttonWeight,
            color: authColors.onPrimary,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
