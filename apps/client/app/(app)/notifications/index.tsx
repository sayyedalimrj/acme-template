/**
 * Notifications route ("/notifications"). Thin wrapper around the notifications shell.
 */
import React from 'react';

import { NotificationsShellScreen } from '@/features/mobile/NotificationsShellScreen';

export default function NotificationsRoute(): React.JSX.Element {
  return <NotificationsShellScreen />;
}
