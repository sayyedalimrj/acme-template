/**
 * Sign-in route ("/sign-in"). Thin wrapper around the auth feature screen.
 */
import React from 'react';

import { SignInScreen } from '@/features/auth/SignInScreen';

export default function SignInRoute(): React.JSX.Element {
  return <SignInScreen />;
}
