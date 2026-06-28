/**
 * Onboarding requests service — mock queue for internal admin review.
 */
import { adminOnboardingRequests, type AdminOnboardingRequest } from '@/mock/onboardingRequests';

export const onboardingService = {
  async listOpenRequests(): Promise<AdminOnboardingRequest[]> {
    return adminOnboardingRequests.filter((r) => r.status !== 'delivered' && r.status !== 'rejected');
  },
};
