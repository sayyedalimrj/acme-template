/**
 * Mock AI Business Advisor adapter.
 *
 * Serves the store-context summary, insights, review-only recommendations, prompt chips, and
 * a deterministic in-memory conversation. Recommendation review/dismiss and the chat mutate
 * only the in-memory copy.
 *
 * SECURITY (binding): NO AI provider, NO external API, NO API keys/secrets. Replies are
 * generated locally by `advisorReply` (keyword matching). Nothing is published, no store data
 * is mutated, and no customer message is sent. `siteId` is ignored by the mock. See
 * security-model.md — a future real provider must go through the backend with permission
 * checks, audit logs, and merchant approval.
 */
import {
  advisorInitialConversation,
  advisorInsights,
  advisorPromptSuggestions,
  advisorRecommendations,
  buildStoreContext,
} from '@/mock/data/aiAdvisor';
import type {
  AIAdvisorConversationMessage,
  AIAdvisorInsight,
  AIAdvisorPromptSuggestion,
  AIAdvisorRecommendation,
  AIAdvisorStoreContextSummary,
} from '@/domain/types';
import { advisorReply } from '@/features/advisor/advisorHelpers';

import type { AIAdvisorAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockAIAdvisorAdapter(): AIAdvisorAdapter {
  let conversation: AIAdvisorConversationMessage[] = clone(advisorInitialConversation);
  let recommendations: AIAdvisorRecommendation[] = clone(advisorRecommendations);
  let seq = 1;

  return {
    async getStoreContextSummary(): Promise<AIAdvisorStoreContextSummary> {
      await delay(150);
      return buildStoreContext();
    },

    async listInsights(): Promise<AIAdvisorInsight[]> {
      await delay(150);
      return clone(advisorInsights);
    },

    async listRecommendations(): Promise<AIAdvisorRecommendation[]> {
      await delay(170);
      return clone(recommendations);
    },

    async listPromptSuggestions(): Promise<AIAdvisorPromptSuggestion[]> {
      await delay(100);
      return clone(advisorPromptSuggestions);
    },

    async getConversation(): Promise<AIAdvisorConversationMessage[]> {
      await delay(120);
      return clone(conversation);
    },

    async sendAdvisorMessageMock(message: string): Promise<AIAdvisorConversationMessage[]> {
      await delay(260);
      const now = new Date().toISOString();
      const userMessage: AIAdvisorConversationMessage = {
        id: `msg_user_${seq++}`,
        role: 'user',
        text: message,
        createdAt: now,
      };
      // Deterministic, local reply — no AI provider, no network.
      const assistantMessage: AIAdvisorConversationMessage = {
        id: `msg_assistant_${seq++}`,
        role: 'assistant',
        text: advisorReply(message),
        createdAt: new Date().toISOString(),
      };
      conversation = [...conversation, userMessage, assistantMessage];
      return clone(conversation);
    },

    async markRecommendationReviewed(id: string): Promise<AIAdvisorRecommendation[]> {
      await delay(140);
      recommendations = recommendations.map((r) =>
        r.id === id ? { ...r, status: 'reviewed' } : r,
      );
      return clone(recommendations);
    },

    async dismissRecommendationMock(id: string): Promise<AIAdvisorRecommendation[]> {
      await delay(140);
      recommendations = recommendations.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' } : r,
      );
      return clone(recommendations);
    },
  };
}
