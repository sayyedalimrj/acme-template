/**
 * Sign-in route ("/sign-in"). Thin wrapper around the mobile-first auth entry screen.
 */
import React from 'react';

import { AuthEntryScreen } from '@/features/auth/AuthEntryScreen';

export default function SignInRoute(): React.JSX.Element {
  return <AuthEntryScreen />;
}
