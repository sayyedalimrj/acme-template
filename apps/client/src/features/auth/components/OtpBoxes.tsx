/**
 * OtpBoxes — a row of 4 single-digit OTP boxes (mock).
 *
 * Matches the Figma reference: ~60×59px boxes, soft gray fill, rounded, blue border when
 * focused/filled. Auto-advances on entry and steps back on backspace. The digits always read
 * left-to-right even in the RTL (Persian) UI. UI-only — no code is sent or validated.
 */
import React, { useRef, useState } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { authColors, authMetrics, authType } from '../authTokens';
import { OTP_LENGTH, toAsciiDigits } from '../authHelpers';

export interface OtpBoxesProps {
  digits: string[];
  onChange: (next: string[]) => void;
  error?: boolean;
  editable?: boolean;
}

export function OtpBoxes({
  digits,
  onChange,
  error = false,
  editable = true,
}: OtpBoxesProps): React.JSX.Element {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const setDigit = (index: number, raw: string): void => {
    // Tolerate Persian/Arabic digits and keep only the last numeric character.
    const sanitized = toAsciiDigits(raw)
      .replace(/[^0-9]/g, '')
      .slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    onChange(next);
    if (sanitized && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View
      // OTP digits always read left-to-right, even in the RTL (Persian) UI.
      style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}
      accessibilityLabel={`${OTP_LENGTH}-digit verification code`}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const focused = focusedIndex === index;
        const filled = Boolean(digits[index]);
        const active = focused || filled;
        return (
          <TextInput
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digits[index] ?? ''}
            onChangeText={(value) => setDigit(index, value)}
            onKeyPress={(event) => onKeyPress(index, event)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((prev) => (prev === index ? null : prev))}
            keyboardType="number-pad"
            maxLength={1}
            editable={editable}
            returnKeyType="next"
            accessibilityLabel={`Digit ${index + 1}`}
            style={{
              width: authMetrics.otpBoxWidth,
              height: authMetrics.otpBoxHeight,
              textAlign: 'center',
              writingDirection: 'ltr',
              fontSize: authType.otpSize,
              fontWeight: '700',
              color: authColors.text,
              backgroundColor: authColors.inputBackground,
              borderRadius: authMetrics.otpRadius,
              borderWidth: 1.5,
              borderColor: error
                ? authColors.danger
                : active
                  ? authColors.inputBorderFocused
                  : authColors.inputBorder,
            }}
          />
        );
      })}
    </View>
  );
}
