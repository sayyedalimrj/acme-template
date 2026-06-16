/**
 * Products route ("/products") — placeholder until the Products module is built.
 */
import React from 'react';

import { ComingSoonScreen } from '@/features/common/ComingSoonScreen';
import { useT } from '@/i18n/I18nProvider';

export default function ProductsRoute(): React.JSX.Element {
  const t = useT();
  return <ComingSoonScreen title={t('nav.products')} />;
}
