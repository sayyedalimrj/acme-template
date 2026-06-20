/**
 * Auth route group layout.
 *
 * Hosts unauthenticated screens (sign-in). If the user is already authenticated, redirect
 * into the correct portal dashboard. Access denied shows a dedicated screen.
 */
import { Redirect, Slot, type Href } from 'expo-router';
import React from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { homeRouteForPortal } from '@/config/portalAccess';
import { useSession } from '@/session/SessionProvider';

export default function AuthGroupLayout(): React.JSX.Element {
  const { status, portal } = useSession();

  if (status === 'access_denied') {
    return <Redirect href={'/access-denied' as Href} />;
  }

  if (status === 'authenticated') {
    return <Redirect href={homeRouteForPortal(portal) as Href} />;
  }

  return (
    <ErrorBoundary scope="auth">
      <Slot />
    </ErrorBoundary>
  );
}
