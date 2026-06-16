/**
 * Mock Support adapter.
 *
 * Manages the internal support operations queue in memory. Staff actions (status change,
 * assignment, checklist toggle, internal note) mutate the in-memory copy and return the
 * updated item; status changes append a timeline event and bump `updatedAt`.
 *
 * SECURITY (binding): every method works on frontend-safe data only. Notes are stored
 * verbatim but are never expected to contain secrets, and no method accepts a credential
 * field. There is NO real provisioning, connection, or notification — that is a server-side
 * concern handled later (backend/proxy or companion plugin). See security-model.md.
 */
import { supportAssignees, supportQueueItems } from '@/mock/data/supportQueue';
import type { AddInternalNoteInput, SupportQueueItem, SupportRequestStatus } from '@/domain/types';

import type { SupportAdapter } from '../types';
import { clone, delay } from './mockUtils';
import { sortQueue } from '@/features/support/supportHelpers';

export function createMockSupportAdapter(): SupportAdapter {
  let items: SupportQueueItem[] = sortQueue(clone(supportQueueItems));
  let noteSeq = 1;

  const find = (id: string): SupportQueueItem => {
    const item = items.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Support request not found: ${id}`);
    }
    return item;
  };

  const replace = (updated: SupportQueueItem) => {
    items = items.map((i) => (i.id === updated.id ? updated : i));
    return clone(updated);
  };

  return {
    async listSupportQueue(): Promise<SupportQueueItem[]> {
      await delay(180);
      return clone(items);
    },

    async getSupportRequest(id: string): Promise<SupportQueueItem> {
      await delay(150);
      return clone(find(id));
    },

    async updateSupportStatus(id: string, status: SupportRequestStatus): Promise<SupportQueueItem> {
      await delay(220);
      const current = find(id);
      const now = new Date().toISOString();
      const updated: SupportQueueItem = {
        ...current,
        status,
        updatedAt: now,
        timeline: [...current.timeline, { status, date: now }],
      };
      return replace(updated);
    },

    async assignSupportRequest(id: string, assigneeId: string | null): Promise<SupportQueueItem> {
      await delay(180);
      const current = find(id);
      const assignee = assigneeId
        ? (supportAssignees.find((a) => a.id === assigneeId) ?? null)
        : null;
      const updated: SupportQueueItem = {
        ...current,
        assignee: assignee ? { ...assignee } : null,
        updatedAt: new Date().toISOString(),
      };
      return replace(updated);
    },

    async toggleChecklistItem(id: string, checklistItemId: string): Promise<SupportQueueItem> {
      await delay(150);
      const current = find(id);
      const updated: SupportQueueItem = {
        ...current,
        updatedAt: new Date().toISOString(),
        checklist: current.checklist.map((c) =>
          c.id === checklistItemId ? { ...c, done: !c.done } : c,
        ),
      };
      return replace(updated);
    },

    async addInternalNote(id: string, input: AddInternalNoteInput): Promise<SupportQueueItem> {
      await delay(200);
      const current = find(id);
      const now = new Date().toISOString();
      // Field-by-field construction — only the frontend-safe body is stored.
      const updated: SupportQueueItem = {
        ...current,
        updatedAt: now,
        notes: [
          ...current.notes,
          { id: `note_new_${noteSeq++}`, author: 'شما', body: input.body, createdAt: now },
        ],
      };
      return replace(updated);
    },
  };
}
