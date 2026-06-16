import { describe, expect, it } from '@jest/globals';

import { supportQueueItems } from '@/mock/data/supportQueue';
import {
  DEFAULT_SUPPORT_FILTERS,
  checklistProgress,
  computeSummary,
  filterQueue,
  isOpen,
  priorityMeta,
  priorityRank,
  riskMeta,
  sortQueue,
  statusOptionsForType,
} from '@/features/support/supportHelpers';

describe('support helpers', () => {
  it('maps priority to label key and tone, with a usable rank order', () => {
    expect(priorityMeta('urgent').tone).toBe('danger');
    expect(priorityMeta('low').labelKey).toBe('support.priority.low');
    expect(priorityRank('urgent')).toBeGreaterThan(priorityRank('low'));
  });

  it('flags insecure-credential risk as danger', () => {
    expect(riskMeta('credentials_requested_externally').tone).toBe('danger');
  });

  it('computes the operations summary from the seed queue', () => {
    const summary = computeSummary(supportQueueItems);
    // All six seeded items are in non-terminal (open) statuses.
    expect(summary.totalOpen).toBe(6);
    expect(summary.urgentOrHigh).toBe(3);
    expect(summary.awaitingCustomer).toBe(2);
    expect(summary.readyForReviewOrConnection).toBe(1);
  });

  it('filters by type, priority, and assignment', () => {
    expect(
      filterQueue(supportQueueItems, { ...DEFAULT_SUPPORT_FILTERS, type: 'existing' }),
    ).toHaveLength(3);
    expect(
      filterQueue(supportQueueItems, { ...DEFAULT_SUPPORT_FILTERS, priority: 'urgent' }),
    ).toHaveLength(1);
    expect(
      filterQueue(supportQueueItems, { ...DEFAULT_SUPPORT_FILTERS, assignment: 'unassigned' }),
    ).toHaveLength(2);
  });

  it('sorts by priority then recency', () => {
    const sorted = sortQueue(supportQueueItems);
    expect(sorted[0].priority).toBe('urgent');
  });

  it('reports checklist progress and open status', () => {
    const provisioning = supportQueueItems.find((i) => i.id === 'onb_new_2002')!;
    expect(checklistProgress(provisioning)).toEqual({ done: 6, total: 8 });
    expect(isOpen('connected')).toBe(false);
    expect(isOpen('under_review')).toBe(true);
  });

  it('offers safe, type-specific status options', () => {
    expect(statusOptionsForType('existing')).toContain('connection_scheduled');
    expect(statusOptionsForType('new')).toContain('provisioning');
    expect(statusOptionsForType('new')).toContain('delivered');
  });
});
