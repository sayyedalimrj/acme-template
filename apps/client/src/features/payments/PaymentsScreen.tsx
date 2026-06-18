/**
 * PaymentsScreen — the store's customer payments view (coming soon).
 *
 * This is the merchant's view of their STORE customer payments / payment activity — NOT the
 * merchant's own subscription/plan billing (that lives under "اشتراک"/Plans). The real activity
 * feed is not built yet, so we show a calm, intentional coming-soon page. Mock-only; no backend.
 */
import React from 'react';

import { useT } from '@/i18n/I18nProvider';

import { MobileComingSoonScreen } from '../mobile/MobileComingSoonScreen';

export function PaymentsScreen(): React.JSX.Element {
  const t = useT();
  return (
    <MobileComingSoonScreen
      testID="payments-screen"
      icon="card-outline"
      title={t('payments.title')}
      subtitle={t('payments.subtitle')}
    />
  );
}
