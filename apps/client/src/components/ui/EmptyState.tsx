/**
 * EmptyState primitive.
 *
 * Standard "nothing here yet" UI: optional icon, title, body, and a primary action. Used
 * across lists and detail screens so empty experiences are consistent and never look broken.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  action?: EmptyStateAction;
  fill?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function EmptyState({
  title,
  body,
  icon = 'file-tray-outline',
  action,
  fill = true,
  style,
  testID,
}: EmptyStateProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View
      testID={testID}
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
          backgroundColor: tokens.color.surfaceAlt,
          marginBottom: tokens.spacing.xs,
        }}
      >
        <Ionicons name={icon} size={26} color={tokens.color.textMuted} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={{ textAlign: 'center', maxWidth: 360 }}>
          {body}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: tokens.spacing.sm }}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}
