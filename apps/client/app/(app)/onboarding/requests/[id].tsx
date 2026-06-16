/**
 * Onboarding request detail route ("/onboarding/requests/[id]").
 * Reads the id param and renders the feature screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { OnboardingRequestDetailScreen } from '@/features/onboarding/OnboardingRequestDetailScreen';

export default function OnboardingRequestDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OnboardingRequestDetailScreen requestId={id} />;
}
