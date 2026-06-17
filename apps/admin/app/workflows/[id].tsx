/** Workflow detail route ("/workflows/[id]"). Internal-only, mock-only. */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { WorkflowDetailScreen } from '@/features/WorkflowDetailScreen';

export default function WorkflowDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkflowDetailScreen workflowId={id} />;
}
