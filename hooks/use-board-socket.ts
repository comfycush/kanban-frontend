"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import {
  releaseAblyClient,
  subscribeBoardChannel,
} from "@/lib/ably-client";
import { boardsKeys } from "./use-boards";

export function useBoardSocket(boardId: string) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token || !boardId) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void subscribeBoardChannel(token, boardId, () => {
      queryClient.invalidateQueries({
        queryKey: boardsKeys.detail(boardId),
      });
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        releaseAblyClient(token);
      } else {
        unsubscribe = unsub;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      releaseAblyClient(token);
    };
  }, [boardId, token, queryClient]);
}
