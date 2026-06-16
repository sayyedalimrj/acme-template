/**
 * Support mutation hooks (TanStack Query), mock-only and in-memory.
 *
 * Each staff action (status change, assignment, checklist toggle, internal note) updates the
 * mock SupportService and, on success, writes the returned item into the detail cache and
 * invalidates the queue list so both views stay in sync.
 *
 * SECURITY: all inputs are frontend-safe. No real provisioning, connection, or notification
 * happens here — those are deferred server-side concerns (see security-model.md).
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { queryKeys, supportService } from '@/services';
import type { SupportQueueItem, SupportRequestStatus } from '@/domain/types';

function useOnUpdated(): (item: SupportQueueItem) => void {
  const queryClient = useQueryClient();
  return (item: SupportQueueItem) => {
    queryClient.setQueryData(queryKeys.supportRequest(item.id), item);
    void queryClient.invalidateQueries({ queryKey: queryKeys.supportQueue() });
  };
}

export function useUpdateSupportStatus(
  id: string,
): UseMutationResult<SupportQueueItem, Error, SupportRequestStatus> {
  const onUpdated = useOnUpdated();
  return useMutation({
    mutationFn: (status: SupportRequestStatus) => supportService.updateSupportStatus(id, status),
    onSuccess: onUpdated,
  });
}

export function useAssignSupportRequest(
  id: string,
): UseMutationResult<SupportQueueItem, Error, string | null> {
  const onUpdated = useOnUpdated();
  return useMutation({
    mutationFn: (assigneeId: string | null) => supportService.assignSupportRequest(id, assigneeId),
    onSuccess: onUpdated,
  });
}

export function useToggleChecklistItem(
  id: string,
): UseMutationResult<SupportQueueItem, Error, string> {
  const onUpdated = useOnUpdated();
  return useMutation({
    mutationFn: (checklistItemId: string) =>
      supportService.toggleChecklistItem(id, checklistItemId),
    onSuccess: onUpdated,
  });
}

export function useAddInternalNote(id: string): UseMutationResult<SupportQueueItem, Error, string> {
  const onUpdated = useOnUpdated();
  return useMutation({
    mutationFn: (body: string) => supportService.addInternalNote(id, { body }),
    onSuccess: onUpdated,
  });
}
