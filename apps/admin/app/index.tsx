/** Platform Admin overview route ("/"). Internal-only, mock-only. */
import React from 'react';

import { PlatformOverviewScreen } from '@/features/PlatformOverviewScreen';

export default function OverviewRoute(): React.JSX.Element {
  return <PlatformOverviewScreen />;
}
