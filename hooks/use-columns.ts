"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Column,
  CreateColumnDto,
  ReorderColumnsDto,
  UpdateColumnDto,
} from "@/lib/types";
import { boardsKeys } from "./use-boards";

export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateColumnDto) =>
      api.post<Column>(`/boards/${boardId}/columns`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { columnId: string; dto: UpdateColumnDto }) =>
      api.patch<Column>(
        `/boards/${boardId}/columns/${vars.columnId}`,
        vars.dto,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}

export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) =>
      api.delete<null>(`/boards/${boardId}/columns/${columnId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}

export function useReorderColumns(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReorderColumnsDto) =>
      api.patch<Column[]>(`/boards/${boardId}/columns/reorder`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}
