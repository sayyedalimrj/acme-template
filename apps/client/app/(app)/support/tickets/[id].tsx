/**
 * Merchant support ticket detail route ("/support/tickets/[id]").
 * Reads the id param and renders the conversation screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { MerchantSupportTicketScreen } from '@/features/support/MerchantSupportTicketScreen';

export default function SupportTicketDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MerchantSupportTicketScreen ticketId={id} />;
}
