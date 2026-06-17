/**
 * SMS & back-in-stock automation route ("/automations"). Thin wrapper around the screen.
 */
import React from 'react';

import { AutomationScreen } from '@/features/automation/AutomationScreen';

export default function AutomationsRoute(): React.JSX.Element {
  return <AutomationScreen />;
}
