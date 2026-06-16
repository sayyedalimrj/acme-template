/**
 * Dashboard overview route ("/").
 *
 * Thin route wrapper that renders the dashboard feature screen. Routes stay declarative;
 * screen logic lives in the feature module.
 */
import React from 'react';

import { DashboardScreen } from '@/features/dashboard/DashboardScreen';

export default function DashboardRoute(): React.JSX.Element {
  return <DashboardScreen />;
}
