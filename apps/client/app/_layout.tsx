/**
 * Root route layout.
 *
 * Mounts the global provider tree and the Expo Router navigator. Headers are hidden because
 * the app provides its own chrome via the AppShell. This file is the single composition
 * root for the whole app.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
