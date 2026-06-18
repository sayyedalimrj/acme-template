/**
 * Support messaging service — thin wrapper over the active SupportMessagingAdapter.
 *
 * Powers the merchant-facing support chat. Screens/hooks call this, never the adapter directly.
 * Mock-only today; a future `http` adapter bridges the same conversation to the internal admin
 * support inbox via OUR backend (see security-model.md).
 */
import { getAdapters } from '@/adapters';
import type { SupportConversation } from '@/domain/types';

export const supportMessagingService = {
  getConversation(): Promise<SupportConversation> {
    return getAdapters().supportMessaging.getConversation();
  },
  sendMessage(body: string): Promise<SupportConversation> {
    return getAdapters().supportMessaging.sendMessage(body);
  },
};
