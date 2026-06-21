/**
 * Merchant support tickets route ("/support/tickets"). Real, backend-backed support inbox.
 */
import React from 'react';

import { MerchantSupportTicketsScreen } from '@/features/support/MerchantSupportTicketsScreen';

export default function SupportTicketsRoute(): React.JSX.Element {
  return <MerchantSupportTicketsScreen />;
}
