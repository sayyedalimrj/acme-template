/**
 * Platform Admin customer/tenant detail route ("/platform-admin/customers/[id]").
 * Reads the id param and renders the feature screen.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { PlatformTenantDetailScreen } from '@/features/platform-admin/PlatformTenantDetailScreen';

export default function PlatformTenantDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlatformTenantDetailScreen tenantId={id} />;
}
