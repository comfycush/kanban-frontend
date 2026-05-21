"use client";

import { useEffect, useState, type ReactNode } from "react";
import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import { ChatClientProvider } from "@ably/chat/react";
import { AblyProvider } from "ably/react";
import { orgChatRoomName } from "@/lib/chat/room";
import { getAblyToken } from "@/lib/server/ably-token";

interface Props {
  authToken: string | null;
  clientId: string | undefined;
  orgId: string;
  children: ReactNode;
}

export function AblyChatProviders({
  authToken,
  clientId,
  orgId,
  children,
}: Props) {
  const [clients, setClients] = useState<{
    realtime: Ably.Realtime;
    chat: ChatClient;
  } | null>(null);

  const roomName = orgChatRoomName(orgId);

  useEffect(() => {
    if (!authToken || !clientId) {
      setClients(null);
      return;
    }

    const realtime = new Ably.Realtime({
      clientId,
      authCallback: (_params, callback) => {
        getAblyToken(authToken, [], [], [roomName])
          .then((tokenRequest) => callback(null, tokenRequest))
          .catch((err: unknown) => {
            const message =
              err instanceof Error ? err.message : "Ably auth failed";
            callback(message, null);
          });
      },
    });

    const chat = new ChatClient(realtime, { logLevel: LogLevel.Error });
    setClients({ realtime, chat });

    return () => {
      realtime.close();
      setClients(null);
    };
  }, [authToken, clientId, roomName]);

  if (!clients) {
    return null;
  }

  return (
    <AblyProvider client={clients.realtime}>
      <ChatClientProvider client={clients.chat}>{children}</ChatClientProvider>
    </AblyProvider>
  );
}
