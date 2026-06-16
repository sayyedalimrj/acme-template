/**
 * AI Business Advisor service — thin wrapper over the active AIAdvisorAdapter.
 *
 * Powers the mock advisor: store-context summary, insights, review-only recommendations,
 * prompt chips, and a deterministic mock conversation. Calls NO AI provider/API and mutates
 * no real store data (see security-model.md). Screens/hooks call this, never the adapter.
 */
import { getAdapters } from '@/adapters';
import type {
  AIAdvisorConversationMessage,
  AIAdvisorInsight,
  AIAdvisorPromptSuggestion,
  AIAdvisorRecommendation,
  AIAdvisorStoreContextSummary,
} from '@/domain/types';

export interface AdvisorOverview {
  context: AIAdvisorStoreContextSummary;
  insights: AIAdvisorInsight[];
  prompts: AIAdvisorPromptSuggestion[];
}

export const aiAdvisorService = {
  getStoreContextSummary(siteId?: string): Promise<AIAdvisorStoreContextSummary> {
    return getAdapters().advisor.getStoreContextSummary(siteId);
  },
  listInsights(siteId?: string): Promise<AIAdvisorInsight[]> {
    return getAdapters().advisor.listInsights(siteId);
  },
  listRecommendations(siteId?: string): Promise<AIAdvisorRecommendation[]> {
    return getAdapters().advisor.listRecommendations(siteId);
  },
  listPromptSuggestions(siteId?: string): Promise<AIAdvisorPromptSuggestion[]> {
    return getAdapters().advisor.listPromptSuggestions(siteId);
  },
  getConversation(siteId?: string): Promise<AIAdvisorConversationMessage[]> {
    return getAdapters().advisor.getConversation(siteId);
  },
  sendAdvisorMessageMock(
    message: string,
    siteId?: string,
  ): Promise<AIAdvisorConversationMessage[]> {
    return getAdapters().advisor.sendAdvisorMessageMock(message, siteId);
  },
  markRecommendationReviewed(id: string): Promise<AIAdvisorRecommendation[]> {
    return getAdapters().advisor.markRecommendationReviewed(id);
  },
  dismissRecommendationMock(id: string): Promise<AIAdvisorRecommendation[]> {
    return getAdapters().advisor.dismissRecommendationMock(id);
  },
  /** Single fetch for the static parts of the advisor screen. */
  async getOverview(siteId?: string): Promise<AdvisorOverview> {
    const advisor = getAdapters().advisor;
    const [context, insights, prompts] = await Promise.all([
      advisor.getStoreContextSummary(siteId),
      advisor.listInsights(siteId),
      advisor.listPromptSuggestions(siteId),
    ]);
    return { context, insights, prompts };
  },
};
