/**
 * MobileListPage — fixed header + FlatList body for paginated lists.
 *
 * Using FlatList (instead of mapping inside a ScrollView) keeps scroll position stable when
 * items are appended via "load more" or when the footer re-renders.
 */
import React, { type ReactElement, type ReactNode } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type FlatListProps,
  type ListRenderItem,
} from 'react-native';

import { useMobileColors } from '../mobileTokens';

export interface MobileListPageProps<T> {
  testID?: string;
  header?: ReactNode;
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  ListHeaderComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  ListEmptyComponent?: ReactElement | null;
  scrollBottomPadding?: number;
  onEndReached?: FlatListProps<T>['onEndReached'];
  onEndReachedThreshold?: number;
}

export function MobileListPage<T>({
  testID,
  header,
  data,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  scrollBottomPadding = 28,
  onEndReached,
  onEndReachedThreshold = 0.4,
}: MobileListPageProps<T>): React.JSX.Element {
  const colors = useMobileColors();

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.background }}>
      {header ? (
        <View
          style={{
            backgroundColor: colors.background,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.separator,
            zIndex: 10,
          }}
        >
          {header}
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: header ? 8 : 10,
          paddingBottom: scrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        maintainVisibleContentPosition={
          data.length > 0 ? { minIndexForVisible: 0 } : undefined
        }
      />
    </View>
  );
}
