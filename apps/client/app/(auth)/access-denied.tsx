/**
 * Access denied route — wrong role for this portal build.
 */
import React from 'react';

import { AccessDeniedScreen } from '@/features/auth/AccessDeniedScreen';

export default function AccessDeniedRoute(): React.JSX.Element {
  return <AccessDeniedScreen />;
}
