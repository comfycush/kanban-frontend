"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ActivityLogItem,
  Attachment,
  Card,
  CardDetail,
  CreateCardDto,
  MoveCardDto,
  UpdateCardDto,
} from "@/lib/types";
import { boardsKeys } from "./use-boards";

export const cardsKeys = {
  detail: (cardId: string) => ["cards", "detail", cardId] as const,
  attachments: (cardId: string) => ["cards", "attachments", cardId] as const,
  activity: (cardId: string) => ["cards", "activity", cardId] as const,
};

export function useCard(cardId: string) {
  return useQuery({
    queryKey: cardsKeys.detail(cardId),
    queryFn: () => api.get<CardDetail>(`/cards/${cardId}`),
    enabled: !!cardId,
  });
}

export function useCardAttachments(cardId: string) {
  return useQuery({
    queryKey: cardsKeys.attachments(cardId),
    queryFn: () => api.get<Attachment[]>(`/cards/${cardId}/attachments`),
    enabled: !!cardId,
  });
}

export function useCardActivity(cardId: string) {
  return useQuery({
    queryKey: cardsKeys.activity(cardId),
    queryFn: () =>
      api.get<ActivityLogItem[]>(`/cards/${cardId}/activity`, { take: 50 }),
    enabled: !!cardId,
  });
}

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { columnId: string; dto: CreateCardDto }) =>
      api.post<Card>(`/columns/${vars.columnId}/cards`, vars.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}

export function useUpdateCard(cardId: string, boardId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateCardDto) =>
      api.patch<CardDetail>(`/cards/${cardId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardsKeys.detail(cardId) });
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
      }
    },
  });
}

export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => api.delete<null>(`/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { cardId: string; dto: MoveCardDto }) =>
      api.patch<CardDetail>(`/cards/${vars.cardId}/move`, vars.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKeys.detail(boardId) });
    },
  });
}

export function useUploadAttachment(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      api.upload<Attachment>(`/cards/${cardId}/attachments`, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cardsKeys.attachments(cardId),
      });
      queryClient.invalidateQueries({ queryKey: cardsKeys.detail(cardId) });
    },
  });
}

export function useDeleteAttachment(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete<null>(`/cards/${cardId}/attachments/${attachmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cardsKeys.attachments(cardId),
      });
      queryClient.invalidateQueries({ queryKey: cardsKeys.detail(cardId) });
    },
  });
}
