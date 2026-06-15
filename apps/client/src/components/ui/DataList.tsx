/**
 * DataList: a lightweight, table-like list built from RN primitives.
 *
 * Renders a header row plus one row per item using a typed column definition. Designed for
 * the small, embedded lists on the dashboard (recent orders, top products). Larger,
 * virtualized lists in the feature modules will use FlatList; this component intentionally
 * maps rows (no nested vertical VirtualizedList) so it composes inside a scrolling Screen.
 *
 * It is direction-aware (RTL) and theme-aware, and exposes a generic row renderer so
 * callers keep full control of cell content.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export type ColumnAlign = 'start' | 'end' | 'center';

export interface Column<T> {
  /** Stable column id. */
  key: string;
  /** Header label. */
  header: string;
  /** Flex weight for the column. Defaults to 1. */
  flex?: number;
  align?: ColumnAlign;
  /** Cell renderer for a row. */
  render: (item: T) => React.ReactNode;
}

export interface DataListProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyLabel?: string;
  testID?: string;
}

function alignToFlex(align: ColumnAlign | undefined): ViewStyle['alignItems'] {
  if (align === 'end') return 'flex-end';
  if (align === 'center') return 'center';
  return 'flex-start';
}

export function DataList<T>({
  data,
  columns,
  keyExtractor,
  emptyLabel,
  testID,
}: DataListProps<T>): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();

  const rowStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  };

  if (data.length === 0) {
    return (
      <View testID={testID} style={{ paddingVertical: tokens.spacing.md }}>
        <Text tone="muted">{emptyLabel ?? '—'}</Text>
      </View>
    );
  }

  return (
    <View testID={testID}>
      {/* Header */}
      <View
        style={[
          rowStyle,
          { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.color.border },
        ]}
      >
        {columns.map((col) => (
          <View key={col.key} style={{ flex: col.flex ?? 1, alignItems: alignToFlex(col.align) }}>
            <Text variant="caption" tone="muted" style={{ fontWeight: '600' }}>
              {col.header}
            </Text>
          </View>
        ))}
      </View>

      {/* Rows */}
      {data.map((item, index) => (
        <View
          key={keyExtractor(item)}
          style={[
            rowStyle,
            index < data.length - 1
              ? {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: tokens.color.border,
                }
              : null,
          ]}
        >
          {columns.map((col) => (
            <View key={col.key} style={{ flex: col.flex ?? 1, alignItems: alignToFlex(col.align) }}>
              {col.render(item)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
