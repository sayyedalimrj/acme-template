/**
 * Shared pagination footer for list screens — load-more (infinite) or page prev/next.
 */
import React from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

export type PaginationMode = 'infinite' | 'pages';

export interface ListPaginationFooterProps {
  mode?: PaginationMode;
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
  onLoadMore?: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

export function ListPaginationFooter({
  mode = 'infinite',
  page,
  pageSize,
  total,
  loading,
  hasNext,
  hasPrev,
  onLoadMore,
  onNextPage,
  onPrevPage,
}: ListPaginationFooterProps): React.JSX.Element | null {
  const t = useT();
  const { rowDirection } = useTheme();

  if (total === 0) return null;

  const shown =
    mode === 'infinite'
      ? Math.min(page * pageSize, total)
      : Math.min((page - 1) * pageSize + pageSize, total);
  const start = mode === 'pages' ? (page - 1) * pageSize + 1 : 1;

  if (mode === 'infinite') {
    if (shown >= total) {
      return (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text variant="caption" tone="muted">
            {t('pagination.allLoaded', { shown: String(total), total: String(total) })}
          </Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 8, paddingVertical: 12, alignItems: 'center' }}>
        <Text variant="caption" tone="muted">
          {t('pagination.showingCount', { shown: String(shown), total: String(total) })}
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canNext = hasNext ?? page < totalPages;
  const canPrev = hasPrev ?? page > 1;

  return (
    <View style={{ gap: 10, paddingVertical: 12, alignItems: 'center' }}>
      <Text variant="caption" tone="muted">
        {t('pagination.pageInfo', {
          start: String(start),
          end: String(Math.min(page * pageSize, total)),
          total: String(total),
          page: String(page),
          pages: String(totalPages),
        })}
      </Text>
      <View style={{ flexDirection: rowDirection, gap: 8 }}>
        <Button
          label={t('pagination.prev')}
          variant="secondary"
          size="sm"
          onPress={onPrevPage}
          disabled={!canPrev || loading}
          testID="list-prev-page"
        />
        <Button
          label={t('pagination.next')}
          variant="secondary"
          size="sm"
          onPress={onNextPage}
          disabled={!canNext || loading}
          loading={loading}
          testID="list-next-page"
        />
      </View>
    </View>
  );
}
