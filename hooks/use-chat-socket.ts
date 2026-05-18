"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket, releaseSocket } from "@/lib/socket-client";
import { messagesKeys } from "./use-messages";
import type { MessageWithUser } from "@/lib/types";

interface ChatEvent {
  type: "message:new";
  message: MessageWithUser;
}

export function useChatSocket(orgId: string) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!token || !orgId) return;

    const socket = getSocket("/chat", token);
    joinedRef.current = false;

    function onConnect() {
      if (joinedRef.current) return;
      socket.emit("joinOrg", { orgId }, (ack: { ok: boolean }) => {
        if (ack?.ok) joinedRef.current = true;
      });
    }

    function onChat(event: ChatEvent) {
      if (event.type !== "message:new") return;

      queryClient.setQueryData<MessageWithUser[]>(
        messagesKeys.list(orgId),
        (prev) => {
          if (!prev) return [event.message];
          // avoid duplicates (REST response may have already added it)
          if (prev.some((m) => m.id === event.message.id)) return prev;
          // API returns newest-first; prepend new messages
          return [event.message, ...prev];
        },
      );
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("chat", onChat);

    return () => {
      socket.off("connect", onConnect);
      socket.off("chat", onChat);
      releaseSocket("/chat", token);
      joinedRef.current = false;
    };
  }, [orgId, token, queryClient]);
}
