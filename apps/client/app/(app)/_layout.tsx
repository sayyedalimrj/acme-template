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

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/components/layout';
import { LoadingState, Screen } from '@/components/ui';
import { ProfileCompletionScreen } from '@/features/auth/ProfileCompletionScreen';
import { useSession } from '@/session/SessionProvider';

export default function AppGroupLayout(): React.JSX.Element {
  const { status, portal, profileComplete } = useSession();

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

  if (status === 'access_denied') {
    return <Redirect href={'/access-denied' as Href} />;
  }

  // One build hosts three role-based experiences. Send admins/affiliates to their portal; the
  // merchant dashboard is the default experience served from this group.
  if (portal === 'admin') {
    return <Redirect href={'/admin' as Href} />;
  }
  if (portal === 'affiliate') {
    return <Redirect href={'/affiliate' as Href} />;
  }

  // First-login profile completion: incomplete users must finish name + email before the app.
  if (!profileComplete) {
    return <ProfileCompletionScreen />;
  }

  return (
    <ErrorBoundary scope="merchant">
      <AppShell>
        <Slot />
      </AppShell>
    </ErrorBoundary>
  );
}
