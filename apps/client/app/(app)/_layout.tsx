/**
 * Authenticated route group layout.
 *
 * The route guard: unauthenticated users are redirected to the sign-in screen; while a
 * sign-in is in flight a loading state is shown; authenticated users get the AppShell
 * (sidebar/topbar/mobile nav) wrapping the in-app routes. Uses Expo Router only — no
 * browser APIs.
 */
import { Redirect, Slot, type Href } from 'expo-router';
import React from 'react';

import { AppShell } from '@/components/layout';
import { LoadingState, Screen } from '@/components/ui';
import { useSession } from '@/session/SessionProvider';

export default function AppGroupLayout(): React.JSX.Element {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <Screen scroll={false} padded={false}>
        <LoadingState />
      </Screen>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href={'/sign-in' as Href} />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
