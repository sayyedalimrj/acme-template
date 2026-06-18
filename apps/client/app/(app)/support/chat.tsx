/**
 * Support chat route ("/support/chat"). Mock conversation shell — no real chat backend.
 */
import React from 'react';

import { SupportChatShellScreen } from '@/features/mobile/SupportChatShellScreen';

export default function SupportChatRoute(): React.JSX.Element {
  return <SupportChatShellScreen />;
}
