/**
 * Order detail route ("/orders/[id]"). Reads the id param and renders the feature screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { OrderDetailScreen } from '@/features/orders/OrderDetailScreen';

export default function OrderDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen orderId={id} />;
}
