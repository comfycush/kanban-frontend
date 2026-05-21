"use client";

import { use } from "react";
import { Center, Group, Loader, Stack, Title } from "@mantine/core";
import { ChatRoomProvider } from "@ably/chat/react";
import { AblyChatProviders } from "@/components/chat/AblyChatProviders";
import {
  OrgChatConnectionBadge,
  OrgChatPanel,
} from "@/components/chat/OrgChatPanel";
import { orgChatRoomName } from "@/lib/chat/room";
import { useAuthStore } from "@/lib/auth-store";
import { useMe } from "@/hooks/use-auth";

export default function MessagesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const token = useAuthStore((s) => s.token);
  const { data: me, isLoading: meLoading } = useMe();

  if (meLoading || !token) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md" mt="md" className="flex-1 min-h-0">
      <AblyChatProviders authToken={token} clientId={me?.id} orgId={orgId}>
        <ChatRoomProvider name={orgChatRoomName(orgId)}>
          <Group gap="sm" align="center">
            <Title order={4}>Messages</Title>
            <OrgChatConnectionBadge />
          </Group>
          <OrgChatPanel />
        </ChatRoomProvider>
      </AblyChatProviders>
    </Stack>
  );
}
