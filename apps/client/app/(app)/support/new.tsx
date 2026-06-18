/**
 * New support request route ("/support/new"). Mock request form — nothing is sent.
 */
import React from 'react';

import { SupportRequestFormScreen } from '@/features/mobile/SupportRequestFormScreen';

export default function SupportNewRequestRoute(): React.JSX.Element {
  return <SupportRequestFormScreen />;
}
