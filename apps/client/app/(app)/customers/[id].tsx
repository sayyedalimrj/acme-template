/**
 * Customer detail route ("/customers/[id]"). Reads the id param and renders the screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { CustomerDetailScreen } from '@/features/customers/CustomerDetailScreen';

export default function CustomerDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomerDetailScreen customerId={id} />;
}
