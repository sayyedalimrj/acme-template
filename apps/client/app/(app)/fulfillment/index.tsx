/**
 * Fulfillment route ("/fulfillment"). Thin wrapper around the Fulfillment feature screen.
 */
import React from 'react';

import { FulfillmentScreen } from '@/features/fulfillment/FulfillmentScreen';

export default function FulfillmentRoute(): React.JSX.Element {
  return <FulfillmentScreen />;
}
