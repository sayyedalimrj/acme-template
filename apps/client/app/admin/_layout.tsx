/**
 * Admin route group layout (the platform owner's back-office).
 *
 * Guard: unauthenticated users go to sign-in; authenticated users whose active portal is NOT
 * `admin` are redirected to the root dispatcher; admins get the AdminShell around the routes.
 */
import { Redirect, Slot, type Href } from 'expo-router';
import React from 'react';

import { LoadingState, Screen } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminShell } from '@/features/admin/AdminShell';
import { ProfileCompletionScreen } from '@/features/auth/ProfileCompletionScreen';
import { useSession } from '@/session/SessionProvider';

export default function AdminGroupLayout(): React.JSX.Element {
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

  if (status === 'access_denied' || portal !== 'admin') {
    return <Redirect href={'/access-denied' as Href} />;
  }

  if (!profileComplete) {
    return <ProfileCompletionScreen />;
  }

  return (
    <ErrorBoundary scope="admin">
      <AdminShell>
        <Slot />
      </AdminShell>
    </ErrorBoundary>
  );
}
