/**
 * Support chat route ("/support/chat"). Thin wrapper around the mock support messenger.
 */
import React from 'react';

import { SupportChatScreen } from '@/features/support/SupportChatScreen';

export default function SupportChatRoute(): React.JSX.Element {
  return <SupportChatScreen />;
}
