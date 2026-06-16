/**
 * AI Business Advisor route ("/advisor"). Thin wrapper around the advisor screen.
 */
import React from 'react';

import { AdvisorScreen } from '@/features/advisor/AdvisorScreen';

export default function AdvisorRoute(): React.JSX.Element {
  return <AdvisorScreen />;
}
