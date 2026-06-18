/**
 * MobileTextField — a soft, mobile-native labeled text input.
 *
 * Used by forms outside the auth flow (e.g. the support request form). Soft gray fill, rounded,
 * blue focus border, no ugly web focus outline, RTL-safe, Persian font. Supports single-line
 * and multiline (textarea-like) modes.
 */
import React, { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '../mobileUxSpec';
import { mobileColors, mobileType } from '../mobileTokens';

export interface MobileTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
}

export function MobileTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType,
  testID,
}: MobileTextFieldProps): React.JSX.Element {
  const { isRTL } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? mobileColors.statusDanger
    : focused
      ? mobileColors.primary
      : 'transparent';

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: mobileType.labelSize,
          fontWeight: '600',
          color: mobileColors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {label}
      </Text>
      <View
        style={{
          minHeight: multiline ? 110 : 54,
          backgroundColor: mobileColors.tile,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          justifyContent: multiline ? 'flex-start' : 'center',
        }}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={mobileColors.mutedSoft}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: multiline ? 1 : undefined,
            fontSize: mobileType.bodySize,
            color: mobileColors.text,
            fontFamily: MOBILE_FONT_FAMILY,
            padding: 0,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
            textAlignVertical: multiline ? 'top' : 'center',
            ...NO_WEB_OUTLINE,
          }}
        />
      </View>
      {error ? (
        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: mobileColors.statusDanger,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
