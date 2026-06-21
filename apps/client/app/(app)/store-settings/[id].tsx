/**
 * Store settings route ("/store-settings/[id]"). Reads the site id and renders the edit screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { StoreSettingsScreen } from '@/features/site/StoreSettingsScreen';

export default function StoreSettingsRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StoreSettingsScreen siteId={id} />;
}
