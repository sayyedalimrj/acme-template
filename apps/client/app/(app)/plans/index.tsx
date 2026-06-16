/**
 * Plans route ("/plans"). Thin wrapper around the subscription plans screen.
 */
import React from 'react';

import { PlansScreen } from '@/features/subscription/PlansScreen';

export default function PlansRoute(): React.JSX.Element {
  return <PlansScreen />;
}
