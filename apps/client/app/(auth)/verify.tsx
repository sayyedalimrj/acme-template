/**
 * Verification route ("/verify"). Thin wrapper around the mock verification feature screen.
 *
 * Lives in the (auth) group so it sits alongside sign-in and inherits the unauthenticated
 * layout. It is UI-only (no code is sent, generated, or validated) — see VerifyScreen.
 */
import React from 'react';

import { VerifyScreen } from '@/features/auth/VerifyScreen';

export default function VerifyRoute(): React.JSX.Element {
  return <VerifyScreen />;
}
