/**
 * Support service — thin wrapper over the active SupportAdapter.
 *
 * Powers the internal support operations queue: listing/reading requests and performing
 * mock staff actions (status progression, assignment, checklist toggles, internal notes).
 * Handles only frontend-safe data; never credentials (see security-model.md). Screens/hooks
 * call this, never the adapter directly.
 */
import { getAdapters } from '@/adapters';
import type { AddInternalNoteInput, SupportQueueItem, SupportRequestStatus } from '@/domain/types';

export const supportService = {
  listSupportQueue(): Promise<SupportQueueItem[]> {
    return getAdapters().support.listSupportQueue();
  },
  getSupportRequest(id: string): Promise<SupportQueueItem> {
    return getAdapters().support.getSupportRequest(id);
  },
  updateSupportStatus(id: string, status: SupportRequestStatus): Promise<SupportQueueItem> {
    return getAdapters().support.updateSupportStatus(id, status);
  },
  assignSupportRequest(id: string, assigneeId: string | null): Promise<SupportQueueItem> {
    return getAdapters().support.assignSupportRequest(id, assigneeId);
  },
  toggleChecklistItem(id: string, checklistItemId: string): Promise<SupportQueueItem> {
    return getAdapters().support.toggleChecklistItem(id, checklistItemId);
  },
  addInternalNote(id: string, input: AddInternalNoteInput): Promise<SupportQueueItem> {
    return getAdapters().support.addInternalNote(id, input);
  },
};
