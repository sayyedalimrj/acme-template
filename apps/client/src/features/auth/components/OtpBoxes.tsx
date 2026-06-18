/**
 * OtpBoxes — a row of 4 single-digit OTP boxes (mock).
 *
 * Soft rounded boxes with a blue active border. Behavior: auto-advances on entry, steps back
 * on backspace when empty, and supports pasting a full code (the digits distribute across the
 * boxes). Numeric keyboard; no ugly web focus outline. Digits always read left-to-right even
 * in the RTL (Persian) UI. UI-only — no code is sent or validated.
 */
import React, { useRef, useState } from 'react';
import {
  Platform,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { resolveFontFamilyForWeight, useAppFont } from '@/theme';

import { NO_WEB_OUTLINE } from '../../mobile/mobileUxSpec';
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
  const { fontsLoaded } = useAppFont();
  const otpFontFamily = resolveFontFamilyForWeight(fontsLoaded, '700');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const focusBox = (index: number): void => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputs.current[clamped]?.focus();
  };

  const setDigit = (index: number, raw: string): void => {
    const cleaned = toAsciiDigits(raw).replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      const next = [...digits];
      let cursor = index;
      for (const ch of cleaned.split('')) {
        if (cursor >= OTP_LENGTH) {
          break;
        }
        next[cursor] = ch;
        cursor += 1;
      }
      onChange(next);
      focusBox(cursor - 1);
      return;
    }

    const sanitized = cleaned.slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    onChange(next);
    if (sanitized && index < OTP_LENGTH - 1) {
      focusBox(index + 1);
    }
  };

  const onKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      focusBox(index - 1);
    }
  };

  return (
    <View
      // Force LTR digit order; fixed-width boxes stay evenly spaced under the full-width CTA.
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
      }}
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
            inputMode="numeric"
            maxLength={1}
            selectTextOnFocus
            editable={editable}
            returnKeyType="next"
            accessibilityLabel={`Digit ${index + 1}`}
            style={{
              width: authMetrics.otpBoxWidth,
              height: authMetrics.otpBoxHeight,
              flexShrink: 0,
              textAlign: 'center',
              writingDirection: 'ltr',
              fontSize: authType.otpSize,
              // Use the bold face directly on native; web keeps fontWeight with a single family name.
              fontFamily: otpFontFamily,
              fontWeight: Platform.OS === 'web' ? '700' : undefined,
              color: authColors.text,
              backgroundColor: authColors.inputBackground,
              borderRadius: authMetrics.otpRadius,
              borderWidth: 1.5,
              borderColor: error
                ? authColors.danger
                : active
                  ? authColors.inputBorderFocused
                  : authColors.inputBorder,
              padding: 0,
              ...NO_WEB_OUTLINE,
            }}
          />
        );
      })}
    </View>
  );
}
