/**
 * Orders route ("/orders") — placeholder until the Orders module is built.
 */
import React from 'react';

import { ComingSoonScreen } from '@/features/common/ComingSoonScreen';
import { useT } from '@/i18n/I18nProvider';

export default function OrdersRoute(): React.JSX.Element {
  const t = useT();
  return <ComingSoonScreen title={t('nav.orders')} />;
}
