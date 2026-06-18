/**
 * Home route ("/"). Thin wrapper around the mobile-first customer home screen.
 */
import React from 'react';

import { MobileHomeScreen } from '@/features/mobile/MobileHomeScreen';

export default function HomeRoute(): React.JSX.Element {
  return <MobileHomeScreen />;
}
