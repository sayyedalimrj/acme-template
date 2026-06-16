/**
 * Customers route ("/customers") — placeholder until the Customers module is built.
 */
import React from 'react';

import { ComingSoonScreen } from '@/features/common/ComingSoonScreen';
import { useT } from '@/i18n/I18nProvider';

export default function CustomersRoute(): React.JSX.Element {
  const t = useT();
  return <ComingSoonScreen title={t('nav.customers')} />;
}
