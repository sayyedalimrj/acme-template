/**
 * Mock support messaging adapter (merchant-facing chat).
 *
 * Holds one in-memory conversation seeded with a friendly agent greeting. `sendMessage`
 * appends the customer's message and a single canned agent reply, mirroring the admin inbox
 * author model (`customer | agent | system`).
 *
 * SECURITY (binding): MOCK-ONLY. NO backend, NO chat provider, NO external send, NO secrets.
 * Nothing leaves the device. A future `http` implementation bridges the same conversation to
 * the internal admin support inbox via OUR backend (see security-model.md and the support
 * messaging plan).
 */
import { supportChatStrings } from '@/mock/data/supportChat';
import type { SupportConversation, SupportChatMessage } from '@/domain/types';

import type { SupportMessagingAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockSupportMessagingAdapter(): SupportMessagingAdapter {
  let seq = 1;
  let conversation: SupportConversation = {
    id: 'conv_support_demo',
    subject: supportChatStrings.subject,
    status: 'open',
    messages: [
      {
        id: 'm_seed',
        author: 'agent',
        authorLabel: supportChatStrings.agentLabel,
        body: supportChatStrings.greeting,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  return {
    async getConversation(): Promise<SupportConversation> {
      await delay(120);
      return clone(conversation);
    },

    async sendMessage(body: string): Promise<SupportConversation> {
      await delay(200);
      const trimmed = body.trim();
      if (trimmed.length === 0) {
        return clone(conversation);
      }
      const customerMessage: SupportChatMessage = {
        id: `m_user_${seq++}`,
        author: 'customer',
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      // Canned, local agent acknowledgement — no provider, nothing sent anywhere.
      const agentMessage: SupportChatMessage = {
        id: `m_agent_${seq++}`,
        author: 'agent',
        authorLabel: supportChatStrings.agentLabel,
        body: supportChatStrings.autoReply,
        createdAt: new Date().toISOString(),
      };
      conversation = {
        ...conversation,
        status: 'waiting_support',
        messages: [...conversation.messages, customerMessage, agentMessage],
      };
      return clone(conversation);
    },
  };
}
