/**
 * ErrorState primitive.
 *
 * Standard error UI with an optional retry action. Used wherever a data request can fail so
 * recovery is consistent. The retry button is omitted when no `onRetry` is provided.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

export interface ErrorStateProps {
  title: string;
  body?: string;
  retryLabel?: string;
  onRetry?: () => void;
  fill?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function ErrorState({
  title,
  body,
  retryLabel = 'Retry',
  onRetry,
  fill = true,
  style,
  testID,
}: ErrorStateProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing.sm,
          padding: tokens.spacing.xl,
        },
        fill ? { flex: 1 } : null,
        style,
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: tokens.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.color.dangerSoft,
          marginBottom: tokens.spacing.xs,
        }}
      >
        <Ionicons name="alert-circle-outline" size={28} color={tokens.color.danger} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={{ textAlign: 'center', maxWidth: 360 }}>
          {body}
        </Text>
      ) : null}
      {onRetry ? (
        <View style={{ marginTop: tokens.spacing.sm }}>
          <Button
            label={retryLabel}
            variant="secondary"
            onPress={onRetry}
            leading={<Ionicons name="refresh" size={16} color={tokens.color.text} />}
          />
        </View>
      ) : null}
    </View>
  );
}
