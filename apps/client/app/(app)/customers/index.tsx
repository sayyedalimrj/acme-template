/**
 * Customers route ("/customers"). Thin wrapper around the Customers list feature screen.
 */
import React from 'react';

import { CustomerListScreen } from '@/features/customers/CustomerListScreen';

export default function CustomersRoute(): React.JSX.Element {
  return <CustomerListScreen />;
}
