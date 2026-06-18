/**
 * Support chat hooks (TanStack Query) — merchant-facing support conversation.
 *
 * Account-level (mock), so the query is NOT site-scoped. Sending a message appends the
 * customer's message + a canned agent reply (mock) and writes the returned thread straight
 * into the query cache. A future `http` adapter bridges the same conversation to the admin
 * support inbox via OUR backend — these hooks/screens stay unchanged.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { queryKeys, supportMessagingService } from '@/services';
import type { SupportConversation } from '@/domain/types';

export function useSupportConversation(): UseQueryResult<SupportConversation, Error> {
  return useQuery({
    queryKey: queryKeys.supportConversation(),
    queryFn: () => supportMessagingService.getConversation(),
  });
}

export function useSendSupportMessage(): UseMutationResult<SupportConversation, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => supportMessagingService.sendMessage(body),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.supportConversation(), conversation);
    },
  });
}
