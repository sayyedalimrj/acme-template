/**
 * Maps onboarding request status to dashboard pending-site card status + next-step copy keys.
 */
import type { OnboardingRequest, PendingSiteCard, PendingSiteStatus } from '@/domain/types';

const NEXT_STEP_KEYS: Record<PendingSiteStatus, string> = {
  awaiting_approval: 'home.pending.nextStep.awaitingApproval',
  preparing: 'home.pending.nextStep.preparing',
  needs_info: 'home.pending.nextStep.needsInfo',
  ready_for_delivery: 'home.pending.nextStep.readyForDelivery',
  rejected: 'home.pending.nextStep.rejected',
};

export function mapOnboardingStatusToPending(status: string): PendingSiteStatus {
  switch (status) {
    case 'submitted':
    case 'under_review':
    case 'ready_for_review':
      return 'awaiting_approval';
    case 'provisioning':
    case 'connection_scheduled':
      return 'preparing';
    case 'needs_customer_action':
    case 'awaiting_assets':
      return 'needs_info';
    case 'ready':
      return 'ready_for_delivery';
    case 'rejected':
    case 'unsupported':
    case 'archived':
      return 'rejected';
    default:
      return 'awaiting_approval';
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
    templateLabel: request.type === 'new' ? request.templateId : undefined,
    planLabel: request.type === 'new' ? request.planId : undefined,
  };
}

export function pendingCardNextStepKey(card: PendingSiteCard): string {
  return card.nextStepMessage;
}
