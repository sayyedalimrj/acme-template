/** Support conversation detail route ("/support/[id]"). Internal-only, mock-only. */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { SupportConversationScreen } from '@/features/SupportConversationScreen';

export default function SupportConversationRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SupportConversationScreen conversationId={id} />;
}
