/**
 * Payments route ("/payments"). Thin wrapper around the store payments / sales screen.
 */
import React from 'react';

import { PaymentsScreen } from '@/features/payments/PaymentsScreen';

export default function PaymentsRoute(): React.JSX.Element {
  return <PaymentsScreen />;
}
