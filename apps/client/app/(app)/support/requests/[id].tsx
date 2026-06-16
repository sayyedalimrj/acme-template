/**
 * Support request detail route ("/support/requests/[id]").
 * Reads the id param and renders the feature screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { SupportRequestDetailScreen } from '@/features/support/SupportRequestDetailScreen';

export default function SupportRequestDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SupportRequestDetailScreen requestId={id} />;
}
