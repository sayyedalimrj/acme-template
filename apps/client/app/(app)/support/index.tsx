/**
 * Support operations route ("/support"). Thin wrapper around the support queue screen.
 */
import React from 'react';

import { SupportQueueScreen } from '@/features/support/SupportQueueScreen';

export default function SupportRoute(): React.JSX.Element {
  return <SupportQueueScreen />;
}
