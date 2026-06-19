/**
 * AuthMethodToggle — a calm two-option segmented switch for the sign-in screen.
 *
 * Lets the user choose between code (OTP) login and password login. Self-contained styling
 * using the auth-flow tokens so it matches the rest of the auth screens. RN-only, RTL/LTR safe
 * (the toggle reads naturally in both directions since the labels are symmetric).
 */
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { authColors, authType } from '../authTokens';

export type AuthMethod = 'code' | 'password';

export interface AuthMethodToggleProps {
  value: AuthMethod;
  onChange: (value: AuthMethod) => void;
}

const OPTIONS: { value: AuthMethod; labelKey: 'auth.entry.method.code' | 'auth.entry.method.password' }[] =
  [
    { value: 'code', labelKey: 'auth.entry.method.code' },
    { value: 'password', labelKey: 'auth.entry.method.password' },
  ];

export function AuthMethodToggle({ value, onChange }: AuthMethodToggleProps): React.JSX.Element {
  const t = useT();
  const { rowDirection } = useTheme();

  return (
    <View
      style={{
        flexDirection: rowDirection,
        backgroundColor: authColors.inputBackground,
        borderRadius: 14,
        padding: 4,
        gap: 4,
      }}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            testID={`auth-method-${option.value}`}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? authColors.background : 'transparent',
              ...(active
                ? {
                    shadowColor: '#23303B',
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }
                : null),
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: authType.labelSize,
                fontWeight: active ? '700' : '500',
                color: active ? authColors.primary : authColors.textSecondary,
              }}
            >
              {t(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
