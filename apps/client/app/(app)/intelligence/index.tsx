/**
 * Customer Intelligence route ("/intelligence"). Thin wrapper around the screen.
 */
import React from 'react';

import { IntelligenceScreen } from '@/features/intelligence/IntelligenceScreen';

export default function IntelligenceRoute(): React.JSX.Element {
  return <IntelligenceScreen />;
}
