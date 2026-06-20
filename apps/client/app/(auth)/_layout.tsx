/**
 * Auth route group layout.
 *
 * Hosts unauthenticated screens (sign-in). If the user is already authenticated, redirect
 * into the app so the sign-in screen is never shown to a signed-in user.
 */
import { Redirect, Slot, type Href } from 'expo-router';
import React from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSession } from '@/session/SessionProvider';

export default function AuthGroupLayout(): React.JSX.Element {
  const { status } = useSession();

  if (status === 'authenticated') {
    return <Redirect href={'/' as Href} />;
  }

  return <ErrorBoundary scope="auth"><Slot /></ErrorBoundary>;
}
