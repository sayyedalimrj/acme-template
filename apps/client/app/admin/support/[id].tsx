/**
 * Admin support ticket detail route ("/admin/support/[id]").
 * Reads the id param and renders the conversation screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { AdminSupportTicketScreen } from '@/features/admin/AdminSupportTicketScreen';

export default function AdminSupportTicketRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AdminSupportTicketScreen ticketId={id} />;
}
