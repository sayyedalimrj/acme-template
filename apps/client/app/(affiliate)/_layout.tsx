/**
 * Affiliate route group layout (the marketer portal).
 *
 * Guard: unauthenticated → sign-in; authenticated but not the `affiliate` portal → root
 * dispatcher; affiliates get the AffiliateShell around the routes.
 */
import { Redirect, Slot, type Href } from 'expo-router';
import React from 'react';

import { LoadingState, Screen } from '@/components/ui';
import { AffiliateShell } from '@/features/affiliate/AffiliateShell';
import { useSession } from '@/session/SessionProvider';

export default function AffiliateGroupLayout(): React.JSX.Element {
  const { status, portal } = useSession();

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

  if (portal !== 'affiliate') {
    return <Redirect href={'/' as Href} />;
  }

  return (
    <AffiliateShell>
      <Slot />
    </AffiliateShell>
  );
}
