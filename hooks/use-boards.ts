"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ActivityLogItem,
  Board,
  BoardWithColumns,
  CreateBoardDto,
  UpdateBoardDto,
} from "@/lib/types";

export const boardsKeys = {
  all: ["boards"] as const,
  listForOrg: (orgId: string) => [...boardsKeys.all, "list", orgId] as const,
  detail: (boardId: string) => [...boardsKeys.all, "detail", boardId] as const,
  activity: (orgId: string) => ["activity", "org", orgId] as const,
};

export function useBoards(orgId: string) {
  return useQuery({
    queryKey: boardsKeys.listForOrg(orgId),
    queryFn: () => api.get<Board[]>(`/orgs/${orgId}/boards`),
    enabled: !!orgId,
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardsKeys.detail(boardId),
    queryFn: () => api.get<BoardWithColumns>(`/boards/${boardId}`),
    enabled: !!boardId,
  });
}

export function useCreateBoard(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBoardDto) =>
      api.post<Board>(`/orgs/${orgId}/boards`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.listForOrg(orgId) });
    },
  });
}

export function useUpdateBoard(boardId: string, orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateBoardDto) =>
      api.patch<Board>(`/boards/${boardId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: boardsKeys.listForOrg(orgId),
        });
      }
    },
  });
}

export function useDeleteBoard(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => api.delete<null>(`/boards/${boardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.listForOrg(orgId) });
    },
  });
}

export function useOrgActivity(orgId: string) {
  return useQuery({
    queryKey: boardsKeys.activity(orgId),
    queryFn: () =>
      api.get<ActivityLogItem[]>(`/orgs/${orgId}/activity`, { take: 100 }),
    enabled: !!orgId,
  });
}
