"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type {
  NotificationItem,
  PrismaUpdateManyResult,
} from "@/lib/types";

export const notificationsKeys = {
  list: (unreadOnly?: boolean) =>
    ["notifications", "list", { unreadOnly: !!unreadOnly }] as const,
};

export function useNotifications(options: { unreadOnly?: boolean } = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: notificationsKeys.list(options.unreadOnly),
    queryFn: () =>
      api.get<NotificationItem[]>("/notifications", {
        unreadOnly: options.unreadOnly,
        take: 50,
      }),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<NotificationItem>(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.patch<PrismaUpdateManyResult>("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
