/**
 * Inventory route ("/inventory"). Thin wrapper around the Inventory feature screen.
 */
import React from 'react';

import { InventoryScreen } from '@/features/inventory/InventoryScreen';

export default function InventoryRoute(): React.JSX.Element {
  return <InventoryScreen />;
}
