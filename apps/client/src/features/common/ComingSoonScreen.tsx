/**
 * ComingSoonScreen.
 *
 * A consistent, honest placeholder for modules that have a route and navigation entry but
 * whose feature work is scheduled for a later task (Products, Orders, Customers, Settings).
 * Uses the shared EmptyState primitive so it never looks broken.
 */
import React from 'react';

import { EmptyState, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

export interface ComingSoonScreenProps {
  title: string;
}

export function ComingSoonScreen({ title }: ComingSoonScreenProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  return (
    <Screen testID="coming-soon-screen">
      <Text variant="title" style={{ marginBottom: tokens.spacing.xs }}>
        {title}
      </Text>
      <EmptyState
        title={t('placeholder.title')}
        body={t('placeholder.body')}
        icon="construct-outline"
      />
    </Screen>
  );
}
