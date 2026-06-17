/**
 * SectionHeader primitive.
 *
 * A small uppercase micro-label (with optional caption and trailing action) used to label
 * groups in the sidebar nav and to introduce sections on screens. Ecme uses quiet uppercase
 * group labels with generous letter-spacing; this recreates that rhythm with RN primitives.
 */
import React, { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface SectionHeaderProps {
  label: string;
  /** Optional secondary caption shown under the label. */
  caption?: string;
  /** Optional trailing element (e.g. a "view all" link or count badge). */
  trailing?: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function SectionHeader({
  label,
  caption,
  trailing,
  style,
  testID,
}: SectionHeaderProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          variant="caption"
          tone="muted"
          style={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}
        >
          {label}
        </Text>
        {caption ? (
          <Text variant="caption" tone="muted">
            {caption}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
