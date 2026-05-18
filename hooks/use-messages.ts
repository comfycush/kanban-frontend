"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreateMessageDto, MessageWithUser } from "@/lib/types";

export const messagesKeys = {
  list: (orgId: string) => ["messages", orgId] as const,
};

export function useMessages(orgId: string) {
  return useQuery({
    queryKey: messagesKeys.list(orgId),
    queryFn: () =>
      api.get<MessageWithUser[]>(`/orgs/${orgId}/messages`, { take: 100 }),
    enabled: !!orgId,
  });
}

export function useSendMessage(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMessageDto) =>
      api.post<MessageWithUser>(`/orgs/${orgId}/messages`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.list(orgId) });
    },
  });
}
