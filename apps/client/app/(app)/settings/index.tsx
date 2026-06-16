/**
 * Settings route ("/settings"). Thin wrapper around the Settings feature screen.
 */
import React from 'react';

import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function SettingsRoute(): React.JSX.Element {
  return <SettingsScreen />;
}
