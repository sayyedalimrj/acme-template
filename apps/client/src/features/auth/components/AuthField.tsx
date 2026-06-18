/**
 * AuthField — large, soft, mobile-first labeled text input for the auth flow.
 *
 * Matches the Figma reference: tall (~65px), soft gray fill, rounded, with a blue focus
 * border and a clean inline error state. RTL/LTR safe; email/mobile values render LTR.
 */
import React, { useState } from 'react';
import {
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '../../mobile/mobileUxSpec';
import { authColors, authMetrics, authType } from '../authTokens';

export interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  editable?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  /** Force LTR text (email / phone values) even in an RTL UI. */
  forceLtrValue?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize = 'none',
  secureTextEntry,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  forceLtrValue = false,
  maxLength,
  autoFocus,
  testID,
  accessibilityLabel,
}: AuthFieldProps): React.JSX.Element {
  const { isRTL } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? authColors.danger
    : focused
      ? authColors.inputBorderFocused
      : authColors.inputBorder;

  const textAlign = forceLtrValue ? 'left' : isRTL ? 'right' : 'left';
  const writingDirection = forceLtrValue ? 'ltr' : isRTL ? 'rtl' : 'ltr';

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: authType.labelSize,
          fontWeight: authType.labelWeight,
          color: authColors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {label}
      </Text>
      <View
        style={{
          height: authMetrics.inputHeight,
          backgroundColor: authColors.inputBackground,
          borderRadius: authMetrics.inputRadius,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 16,
          justifyContent: 'center',
        }}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={accessibilityLabel ?? label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={authColors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            fontSize: authType.inputSize,
            color: authColors.text,
            fontFamily: MOBILE_FONT_FAMILY,
            padding: 0,
            textAlign,
            writingDirection,
            ...NO_WEB_OUTLINE,
          }}
        />
      </View>
      {error ? (
        <Text
          style={{
            fontSize: authType.helperSize,
            color: authColors.danger,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
