/**
 * Shared pagination footer for list screens — load more when more pages exist.
 */
import React from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

export interface ListPaginationFooterProps {
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onLoadMore: () => void;
}

export function ListPaginationFooter({
  page,
  pageSize,
  total,
  loading,
  onLoadMore,
}: ListPaginationFooterProps): React.JSX.Element | null {
  const t = useT();
  const shown = page * pageSize;
  if (shown >= total) return null;

  return (
    <View style={{ gap: 8, paddingVertical: 12, alignItems: 'center' }}>
      <Text variant="caption" tone="muted">
        {`${Math.min(shown, total)} / ${total}`}
      </Text>
      <Button
        label={loading ? t('common.loading') : t('pagination.loadMore')}
        variant="secondary"
        onPress={onLoadMore}
        loading={loading}
        testID="list-load-more"
      />
    </View>
  );
}
