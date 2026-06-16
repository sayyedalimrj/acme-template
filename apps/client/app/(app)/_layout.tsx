/**
 * Authenticated route group layout.
 *
 * Wraps all in-app routes with the AppShell (sidebar/topbar/mobile nav). It also hosts the
 * AUTH GATE placeholder: it checks the session boundary and, in a later task, will redirect
 * unauthenticated users to the sign-in screen. For Task 1 a mock user is always present, so
 * the gate currently renders the shell.
 */
import { Slot } from 'expo-router';
import React from 'react';

import { AppShell } from '@/components/layout';
import { useSession } from '@/session/SessionProvider';

export default function AppGroupLayout(): React.JSX.Element | null {
  const { status } = useSession();

  // Auth gate placeholder. Real redirect to (auth)/sign-in arrives in the Auth/session task:
  //   if (status === 'unauthenticated') return <Redirect href="/(auth)/sign-in" />;
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
