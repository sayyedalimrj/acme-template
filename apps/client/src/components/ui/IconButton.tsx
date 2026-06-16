/**
 * IconButton primitive.
 *
 * A circular, icon-only action used in the top bar / toolbars (Ecme header action style).
 * Cross-platform: hover feedback on web (react-native-web Pressable hover events) and press
 * feedback everywhere. Always requires an accessibilityLabel.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState, type ComponentProps } from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type IconButtonTone = 'muted' | 'primary' | 'danger';

export interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
  tone?: IconButtonTone;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 20,
  tone = 'muted',
  style,
}: IconButtonProps): React.JSX.Element {
  const { tokens } = useTheme();
  const [hovered, setHovered] = useState(false);

  const color =
    tone === 'primary'
      ? tokens.color.primary
      : tone === 'danger'
        ? tokens.color.danger
        : tokens.color.textMuted;

  const base: ViewStyle = {
    width: 38,
    height: 38,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        base,
        hovered || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
