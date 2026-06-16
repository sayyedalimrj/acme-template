/**
 * Pure helpers for the support operations module: priority/risk presentation, queue
 * summary, checklist progress, status options, and filtering. React-free for easy unit
 * testing. Status badges reuse the shared onboarding `statusMeta` (both share the same
 * status vocabulary), so labels/tones stay consistent across merchant + support views.
 *
 * SECURITY: helpers only read frontend-safe fields; none accept or surface credentials.
 */
import type { BadgeTone } from '@/components/ui';
import type {
  SupportActionOwner,
  SupportHandoffRisk,
  SupportOperationsSummary,
  SupportPriority,
  SupportQueueItem,
  SupportRequestStatus,
  SupportRequestType,
} from '@/domain/types';
import { statusMeta } from '@/features/onboarding/onboardingHelpers';
import type { StringKey } from '@/i18n/strings';

export { statusMeta };

// --- Priority ---------------------------------------------------------------

export const SUPPORT_PRIORITIES: SupportPriority[] = ['urgent', 'high', 'medium', 'low'];

interface Meta {
  labelKey: StringKey;
  tone: BadgeTone;
}

const PRIORITY_META: Record<SupportPriority, Meta> = {
  urgent: { labelKey: 'support.priority.urgent', tone: 'danger' },
  high: { labelKey: 'support.priority.high', tone: 'warning' },
  medium: { labelKey: 'support.priority.medium', tone: 'info' },
  low: { labelKey: 'support.priority.low', tone: 'neutral' },
};

export function priorityMeta(priority: SupportPriority): Meta {
  return PRIORITY_META[priority];
}

const PRIORITY_RANK: Record<SupportPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

export function priorityRank(priority: SupportPriority): number {
  return PRIORITY_RANK[priority];
}

// --- Risk -------------------------------------------------------------------

const RISK_META: Record<SupportHandoffRisk, Meta> = {
  platform_unconfirmed: { labelKey: 'support.risk.platform_unconfirmed', tone: 'warning' },
  awaiting_customer: { labelKey: 'support.risk.awaiting_customer', tone: 'info' },
  assets_incomplete: { labelKey: 'support.risk.assets_incomplete', tone: 'warning' },
  domain_unverified: { labelKey: 'support.risk.domain_unverified', tone: 'warning' },
  credentials_requested_externally: {
    labelKey: 'support.risk.credentials_requested_externally',
    tone: 'danger',
  },
};

export function riskMeta(risk: SupportHandoffRisk): Meta {
  return RISK_META[risk];
}

export function ownerLabelKey(owner: SupportActionOwner): StringKey {
  return owner === 'support' ? 'support.owner.support' : 'support.owner.customer';
}

export function typeLabelKey(type: SupportRequestType): StringKey {
  return type === 'existing' ? 'onboarding.detail.type.existing' : 'onboarding.detail.type.new';
}

// --- Status sets ------------------------------------------------------------

/** Terminal statuses (a request is no longer "open" once it reaches one of these). */
export const TERMINAL_STATUSES: SupportRequestStatus[] = [
  'connected',
  'delivered',
  'unsupported',
  'archived',
];

const EXISTING_STATUSES: SupportRequestStatus[] = [
  'submitted',
  'under_review',
  'needs_customer_action',
  'connection_scheduled',
  'connected',
  'unsupported',
  'archived',
];

const NEW_STATUSES: SupportRequestStatus[] = [
  'submitted',
  'under_review',
  'awaiting_assets',
  'provisioning',
  'ready_for_review',
  'connected',
  'delivered',
  'archived',
];

/** The safe, predefined statuses a teammate may move a request to, by request type. */
export function statusOptionsForType(type: SupportRequestType): SupportRequestStatus[] {
  return type === 'existing' ? EXISTING_STATUSES : NEW_STATUSES;
}

export function isOpen(status: SupportRequestStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

const AWAITING_CUSTOMER: SupportRequestStatus[] = ['needs_customer_action', 'awaiting_assets'];
const READY_STATUSES: SupportRequestStatus[] = ['ready_for_review', 'connection_scheduled'];

// --- Summary + progress -----------------------------------------------------

export function computeSummary(items: SupportQueueItem[]): SupportOperationsSummary {
  let totalOpen = 0;
  let urgentOrHigh = 0;
  let awaitingCustomer = 0;
  let readyForReviewOrConnection = 0;
  for (const item of items) {
    const open = isOpen(item.status);
    if (open) {
      totalOpen += 1;
      if (item.priority === 'urgent' || item.priority === 'high') {
        urgentOrHigh += 1;
      }
    }
    if (AWAITING_CUSTOMER.includes(item.status)) {
      awaitingCustomer += 1;
    }
    if (READY_STATUSES.includes(item.status)) {
      readyForReviewOrConnection += 1;
    }
  }
  return { totalOpen, urgentOrHigh, awaitingCustomer, readyForReviewOrConnection };
}

export function checklistProgress(item: SupportQueueItem): { done: number; total: number } {
  const total = item.checklist.length;
  const done = item.checklist.filter((c) => c.done).length;
  return { done, total };
}

// --- Filtering --------------------------------------------------------------

export type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

export interface SupportFilters {
  type: SupportRequestType | 'all';
  status: SupportRequestStatus | 'all';
  priority: SupportPriority | 'all';
  assignment: AssignmentFilter;
}

export const DEFAULT_SUPPORT_FILTERS: SupportFilters = {
  type: 'all',
  status: 'all',
  priority: 'all',
  assignment: 'all',
};

export function filterQueue(
  items: SupportQueueItem[],
  filters: SupportFilters,
): SupportQueueItem[] {
  return items.filter((item) => {
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
    if (filters.assignment === 'assigned' && !item.assignee) return false;
    if (filters.assignment === 'unassigned' && item.assignee) return false;
    return true;
  });
}

/** Sort by priority (desc), then most recently updated first. */
export function sortQueue(items: SupportQueueItem[]): SupportQueueItem[] {
  return [...items].sort((a, b) => {
    const byPriority = priorityRank(b.priority) - priorityRank(a.priority);
    if (byPriority !== 0) return byPriority;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

/** The primary subtitle line for a queue item (site URL for A, domain for B). */
export function primaryLine(item: SupportQueueItem): string {
  return item.siteUrl ?? item.domain ?? '';
}
