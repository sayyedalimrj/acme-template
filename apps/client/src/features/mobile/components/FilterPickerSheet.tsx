/**
 * FilterPickerSheet — compact filter control with a bottom sheet for secondary options.
 *
 * Keeps primary screens uncluttered: one tappable row opens a modal list instead of many chips.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileMetrics, mobileType, useMobileColors } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface FilterPickerOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterPickerSheetProps<T extends string> {
  label: string;
  value: T;
  options: readonly FilterPickerOption<T>[];
  onChange: (value: T) => void;
  testID?: string;
}

export function FilterPickerSheet<T extends string>({
  label,
  value,
  options,
  onChange,
  testID,
}: FilterPickerSheetProps<T>): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, isRTL } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];

  const pick = (next: T): void => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <PressableScale
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: 40,
          paddingHorizontal: 14,
          borderRadius: mobileMetrics.cardRadiusSmall,
          backgroundColor: colors.tile,
        }}
      >
        <Text style={{ fontSize: mobileType.captionSize, color: colors.textSecondary, fontWeight: '600' }}>
          {label}
        </Text>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <Text
            style={{ fontSize: mobileType.captionSize, color: colors.text, fontWeight: '700' }}
            numberOfLines={1}
          >
            {selected?.label ?? ''}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.muted} />
        </View>
      </PressableScale>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              maxHeight: '70%',
              borderTopLeftRadius: mobileMetrics.cardRadius,
              borderTopRightRadius: mobileMetrics.cardRadius,
              backgroundColor: colors.card,
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: mobileMetrics.screenPadding,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.separator,
              }}
            >
              <Text style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}>
                {label}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView style={{ paddingHorizontal: mobileMetrics.screenPadding, paddingTop: 8 }}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => pick(option.value)}
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.separator,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: mobileType.labelSize,
                        fontWeight: active ? '700' : '500',
                        color: active ? colors.primary : colors.text,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {option.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
