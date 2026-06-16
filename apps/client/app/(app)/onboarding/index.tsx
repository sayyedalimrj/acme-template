/**
 * Onboarding route ("/onboarding"). Thin wrapper around the onboarding home screen.
 */
import React from 'react';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';

export default function OnboardingRoute(): React.JSX.Element {
  return <OnboardingScreen />;
}
