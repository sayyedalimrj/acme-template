/**
 * AddActionButton — a primary "add" pill for list screens (mock).
 *
 * The prominent "Add product" / "Add customer" affordance the merchant expects on list screens.
 * Real creation is not wired yet, so pressing it reveals a short, honest "coming soon" caption
 * instead of performing an action. Soft blue pill, short label, RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { MOBILE_FONT_FAMILY } from '../mobileUxSpec';
import { mobileColors, mobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface AddActionButtonProps {
  label: string;
  /** Short caption shown after the user taps (e.g. "Coming soon"). */
  comingSoonLabel: string;
  testID?: string;
}

export function AddActionButton({
  label,
  comingSoonLabel,
  testID,
}: AddActionButtonProps): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();
  const [showSoon, setShowSoon] = useState(false);

  return (
    <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 4 }}>
      <PressableScale
        testID={testID}
        accessibilityLabel={`${label} — ${comingSoonLabel}`}
        onPress={() => setShowSoon((v) => !v)}
        pressScale={0.96}
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 6,
          height: 40,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: mobileColors.primarySoft,
        }}
      >
        <Ionicons name="add" size={18} color={mobileColors.primary} />
        <Text
          style={{
            color: mobileColors.primary,
            fontWeight: '700',
            fontSize: mobileType.labelSize,
            fontFamily: MOBILE_FONT_FAMILY,
          }}
        >
          {label}
        </Text>
      </PressableScale>
      {showSoon ? (
        <Text
          testID={testID ? `${testID}-soon` : undefined}
          style={{ fontSize: 11, color: mobileColors.textSecondary }}
        >
          {comingSoonLabel}
        </Text>
      ) : null}
    </View>
  );
}
