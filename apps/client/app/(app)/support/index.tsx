/**
 * Support route ("/support"). Thin wrapper around the customer support shell.
 * Shell only — no real chat backend/provider; the full conversation flow is a later PR.
 */
import React from 'react';

import { SupportShellScreen } from '@/features/mobile/SupportShellScreen';

export default function SupportRoute(): React.JSX.Element {
  return <SupportShellScreen />;
}
