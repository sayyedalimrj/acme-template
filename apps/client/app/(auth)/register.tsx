/**
 * Registration route ("/register"). Thin wrapper around the first-time profile screen.
 * Mock-only: it creates an in-memory session and never persists or contacts a backend.
 */
import React from 'react';

import { RegisterProfileScreen } from '@/features/auth/RegisterProfileScreen';

export default function RegisterRoute(): React.JSX.Element {
  return <RegisterProfileScreen />;
}
