/**
 * Payments route ("/payments"). Store customer payments view (coming soon).
 * This is NOT subscription billing — that lives under Plans ("/plans").
 */
import React from 'react';

import { PaymentsScreen } from '@/features/payments/PaymentsScreen';

export default function PaymentsRoute(): React.JSX.Element {
  return <PaymentsScreen />;
}
