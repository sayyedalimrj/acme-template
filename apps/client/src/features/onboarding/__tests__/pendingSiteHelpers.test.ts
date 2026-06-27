import { describe, expect, it } from '@jest/globals';

import { onboardingRequests } from '@/mock/data/onboardingRequests';
import {
  isPendingOnboardingRequest,
  onboardingToPendingCard,
} from '@/features/onboarding/pendingSiteHelpers';

describe('pendingSiteHelpers', () => {
  it('marks non-delivered onboarding requests as pending dashboard cards', () => {
    const pending = onboardingRequests.filter(isPendingOnboardingRequest);
    expect(pending.length).toBeGreaterThan(0);
    const card = onboardingToPendingCard(pending[0]!);
    expect(card.kind).toBe('pending_request');
    expect(card.status).toBeDefined();
    expect(card.nextStepMessage.startsWith('home.pending.')).toBe(true);
  });

  it('excludes delivered requests from pending cards', () => {
    const delivered = onboardingRequests.find((r) => r.status === 'delivered');
    if (delivered) {
      expect(isPendingOnboardingRequest(delivered)).toBe(false);
    }
  });
});
