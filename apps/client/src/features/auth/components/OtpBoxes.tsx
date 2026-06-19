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
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { MOBILE_FONT_FAMILY, NO_WEB_OUTLINE } from '../../mobile/mobileUxSpec';
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

  const focusBox = (index: number): void => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputs.current[clamped]?.focus();
  };

  const setDigit = (index: number, raw: string): void => {
    // Tolerate Persian/Arabic digits; keep only numerics.
    const cleaned = toAsciiDigits(raw).replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      // Paste / multi-char: distribute digits across boxes starting at this index.
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
      // OTP digits always read left-to-right, even in the RTL (Persian) UI. Boxes flex to fill
      // the row so the group lines up with the full-width verify button beneath it. `alignSelf`
      // centers the (capped-width) group; `direction: ltr` keeps box order stable under RTL.
      style={{
        flexDirection: 'row',
        gap: 12,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 320,
        direction: 'ltr',
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
            // Allow a full paste into one box; the value stays a single controlled digit.
            maxLength={OTP_LENGTH}
            selectTextOnFocus
            editable={editable}
            returnKeyType="next"
            accessibilityLabel={`Digit ${index + 1}`}
            style={{
              flex: 1,
              // Critical on web: without `minWidth: 0`, the input's intrinsic content width
              // prevents flex from shrinking the boxes and they overflow the frame.
              minWidth: 0,
              height: authMetrics.otpBoxHeight,
              textAlign: 'center',
              writingDirection: 'ltr',
              fontSize: authType.otpSize,
              fontWeight: '700',
              fontFamily: MOBILE_FONT_FAMILY,
              color: authColors.text,
              backgroundColor: authColors.inputBackground,
              borderRadius: authMetrics.otpRadius,
              borderWidth: 1.5,
              borderColor: error
                ? authColors.danger
                : active
                  ? authColors.inputBorderFocused
                  : authColors.inputBorder,
              ...NO_WEB_OUTLINE,
            }}
          />
        );
      })}
    </View>
  );
}
