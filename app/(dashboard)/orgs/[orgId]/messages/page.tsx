"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useMe } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

dayjs.extend(relativeTime);

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export default function MessagesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { data: messages, isLoading } = useMessages(orgId);
  const { data: me } = useMe();
  const sendMessage = useSendMessage(orgId);
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Connect to Socket.IO /chat namespace for real-time incoming messages
  useChatSocket(orgId);

  // API returns newest-first; render oldest-first for chat UX
  const ordered = messages ? [...messages].reverse() : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ordered.length]);

  const onSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setContent("");
    try {
      await sendMessage.mutateAsync({ content: trimmed });
    } catch (error) {
      setContent(trimmed);
      notifications.show({
        color: "red",
        title: "Send failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md" mt="md" className="flex-1 min-h-0">
      <Group gap="sm" align="center">
        <Title order={4}>Messages</Title>
        <Badge variant="dot" color="green" size="sm">
          Live
        </Badge>
      </Group>

      <Card withBorder p={0} radius="md" className="flex flex-col">
        <ScrollArea viewportRef={scrollRef} h={520} type="auto">
          <Stack gap="md" p="md">
            {ordered.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No messages yet. Start the conversation.
              </Text>
            ) : (
              ordered.map((m) => {
                const mine = m.userId === me?.id;
                return (
                  <Group
                    key={m.id}
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                    justify={mine ? "flex-end" : "flex-start"}
                  >
                    {!mine && (
                      <Avatar color="brand" radius="xl" size="sm">
                        {initials(m.user.email)}
                      </Avatar>
                    )}
                    <Stack gap={2} className="max-w-[70%]">
                      <Group
                        gap="xs"
                        justify={mine ? "flex-end" : "flex-start"}
                      >
                        <Text size="xs" fw={500}>
                          {mine ? "You" : m.user.email}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {dayjs(m.createdAt).fromNow()}
                        </Text>
                      </Group>
                      <div
                        className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                          mine
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </Stack>
                    {mine && (
                      <Avatar color="brand" radius="xl" size="sm">
                        {initials(m.user.email)}
                      </Avatar>
                    )}
                  </Group>
                );
              })
            )}
          </Stack>
        </ScrollArea>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <Group align="flex-end" gap="sm" wrap="nowrap">
            <Textarea
              autosize
              minRows={1}
              maxRows={5}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={onSend}
              loading={sendMessage.isPending}
              disabled={!content.trim()}
            >
              Send
            </Button>
          </Group>
        </div>
      </Card>
    </Stack>
  );
}
