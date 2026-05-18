"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket, releaseSocket } from "@/lib/socket-client";
import { boardsKeys } from "./use-boards";

export function useBoardSocket(boardId: string) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!token || !boardId) return;

    const socket = getSocket("/board", token);
    joinedRef.current = false;

    function onConnect() {
      if (joinedRef.current) return;
      socket.emit("joinBoard", { boardId }, (ack: { ok: boolean }) => {
        if (ack?.ok) joinedRef.current = true;
      });
    }

    function onBoard() {
      // Invalidate the board query so columns/cards re-fetch with latest state
      queryClient.invalidateQueries({
        queryKey: boardsKeys.detail(boardId),
      });
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("board", onBoard);

    return () => {
      socket.off("connect", onConnect);
      socket.off("board", onBoard);
      if (joinedRef.current) {
        socket.emit("leaveBoard", { boardId });
      }
      releaseSocket("/board", token);
      joinedRef.current = false;
    };
  }, [boardId, token, queryClient]);
}
