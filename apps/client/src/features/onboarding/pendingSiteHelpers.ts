/**
 * Maps onboarding request status to dashboard pending-site card status + next-step copy keys.
 */
import type { OnboardingRequest, PendingSiteCard, PendingSiteStatus } from '@/domain/types';

const NEXT_STEP_KEYS: Record<PendingSiteStatus, string> = {
  pending_build: 'home.pending.nextStep.building',
  under_review: 'home.pending.nextStep.review',
  approved: 'home.pending.nextStep.approved',
  rejected: 'home.pending.nextStep.rejected',
  ready: 'home.pending.nextStep.ready',
  connected: 'home.pending.nextStep.connected',
};

export function mapOnboardingStatusToPending(status: string): PendingSiteStatus {
  switch (status) {
    case 'submitted':
    case 'provisioning':
    case 'connection_scheduled':
      return 'pending_build';
    case 'under_review':
    case 'needs_customer_action':
    case 'awaiting_assets':
    case 'ready_for_review':
      return 'under_review';
    case 'ready':
      return 'ready';
    case 'connected':
    case 'delivered':
      return 'connected';
    case 'rejected':
    case 'unsupported':
    case 'archived':
      return 'rejected';
    default:
      return 'pending_build';
  }
}

/** Onboarding requests that should appear as pending dashboard cards (not yet delivered). */
export function isPendingOnboardingRequest(request: OnboardingRequest): boolean {
  return !['delivered', 'connected', 'archived', 'unsupported'].includes(request.status);
}

export function onboardingToPendingCard(request: OnboardingRequest): PendingSiteCard {
  const status = mapOnboardingStatusToPending(request.status);
  const domainOrUrl = request.type === 'existing' ? request.siteUrl : request.domain;

  return {
    kind: 'pending_request',
    id: `pending-${request.id}`,
    requestId: request.id,
    title: request.businessName,
    domainOrUrl,
    status,
    requestDate: request.createdAt,
    nextStepMessage: NEXT_STEP_KEYS[status],
    type: request.type,
  };
}

export function pendingCardNextStepKey(card: PendingSiteCard): string {
  return card.nextStepMessage;
}
