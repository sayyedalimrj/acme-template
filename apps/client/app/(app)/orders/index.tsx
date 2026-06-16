/**
 * Orders route ("/orders"). Thin wrapper around the Orders list feature screen.
 */
import React from 'react';

import { OrderListScreen } from '@/features/orders/OrderListScreen';

export default function OrdersRoute(): React.JSX.Element {
  return <OrderListScreen />;
}
