/**
 * MobileSearchField — soft, mobile-native search input.
 *
 * A rounded, soft-gray search field with a leading icon. RTL-safe, Persian font, and no ugly
 * web focus outline (our own subtle focus border instead).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '../mobileUxSpec';
import { mobileColors, mobileType } from '../mobileTokens';

export interface MobileSearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
}

export function MobileSearchField({
  value,
  onChangeText,
  placeholder,
  testID,
}: MobileSearchFieldProps): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 10,
        height: 48,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: mobileColors.tile,
        borderWidth: 1.5,
        borderColor: focused ? mobileColors.primary : 'transparent',
      }}
    >
      <Ionicons name="search-outline" size={18} color={mobileColors.muted} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mobileColors.mutedSoft}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          fontSize: mobileType.bodySize,
          color: mobileColors.text,
          fontFamily: MOBILE_FONT_FAMILY,
          padding: 0,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
          ...NO_WEB_OUTLINE,
        }}
      />
    </View>
  );
}
