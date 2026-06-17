/**
 * Platform Admin route ("/platform-admin"). Thin wrapper around the overview screen.
 * Internal control layer — mock-only (see security-model.md).
 */
import React from 'react';

import { PlatformAdminScreen } from '@/features/platform-admin/PlatformAdminScreen';

export default function PlatformAdminRoute(): React.JSX.Element {
  return <PlatformAdminScreen />;
}
