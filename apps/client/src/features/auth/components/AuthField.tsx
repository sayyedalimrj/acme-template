/**
 * AuthField — large, soft, mobile-first labeled text input for the auth flow.
 *
 * Matches the Figma reference: tall (~65px), soft gray fill, rounded, with a blue focus
 * border and a clean inline error state. RTL/LTR safe; email/mobile values render LTR.
 */
import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { NO_WEB_OUTLINE, useMobileFontFamily } from '../../mobile/mobileUxSpec';
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
  /**
   * Keep the keyboard open after submit (used when Enter should jump to the next field rather
   * than dismiss the keyboard). Defaults to false for `returnKeyType="next"`.
   */
  blurOnSubmit?: boolean;
  /** Force LTR text (email / phone values) even in an RTL UI. */
  forceLtrValue?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  {
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
    blurOnSubmit,
    forceLtrValue = false,
    maxLength,
    autoFocus,
    testID,
    accessibilityLabel,
  }: AuthFieldProps,
  ref,
): React.JSX.Element {
  const { isRTL } = useTheme();
  const fontFamily = useMobileFontFamily();
  const [focused, setFocused] = useState(false);
  // When Enter should advance to the next field, keep the keyboard open.
  const keepKeyboard = blurOnSubmit ?? returnKeyType === 'next';

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
          ref={ref}
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
          blurOnSubmit={keepKeyboard ? false : undefined}
          submitBehavior={keepKeyboard ? 'submit' : undefined}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            fontSize: authType.inputSize,
            color: authColors.text,
            fontFamily,
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
});
