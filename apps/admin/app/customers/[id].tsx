/** Customer/tenant detail route ("/customers/[id]"). Internal-only, mock-only. */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { TenantDetailScreen } from '@/features/TenantDetailScreen';

export default function CustomerDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TenantDetailScreen tenantId={id} />;
}
