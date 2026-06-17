/**
 * Root layout for the internal admin app. Mounts providers (safe-area + system context) and
 * the admin chrome (AdminShell) around the Expo Router slot. Internal-only; no merchant nav.
 */
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdminShell } from '@/features/AdminShell';
import { SystemProvider } from '@/system';

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SystemProvider>
        <StatusBar style="auto" />
        <AdminShell>
          <Slot />
        </AdminShell>
      </SystemProvider>
    </SafeAreaProvider>
  );
}
