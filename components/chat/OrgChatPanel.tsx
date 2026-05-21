"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  ChatMessageAction,
  ChatMessageEvent,
  ChatMessageEventType,
  ConnectionStatus,
  Message,
  OrderBy,
} from "@ably/chat";
import { useChatConnection, useMessages } from "@ably/chat/react";
import { useMe } from "@/hooks/use-auth";

interface MessageMetadata {
  email?: string;
  fullName?: string;
}

function initials(label: string): string {
  return label.slice(0, 2).toUpperCase();
}

function displayLabel(message: Message): string {
  const meta = message.metadata as MessageMetadata;
  return meta.fullName?.trim() || meta.email || message.clientId;
}

function sortMessages(items: Message[]): Message[] {
  return [...items].sort((a, b) => (a.serial < b.serial ? -1 : 1));
}

function upsertMessage(messages: Message[], message: Message): Message[] {
  const index = messages.findIndex((m) => m.serial === message.serial);
  if (index === -1) {
    return sortMessages([...messages, message]);
  }
  const next = [...messages];
  next[index] = next[index].with(message);
  return sortMessages(next);
}

export function OrgChatPanel() {
  const { data: me } = useMe();
  const { currentStatus } = useChatConnection();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onMessageEvent = useCallback((event: ChatMessageEvent) => {
    setMessages((prev) => {
      switch (event.type) {
        case ChatMessageEventType.Created:
        case ChatMessageEventType.Updated:
        case ChatMessageEventType.Deleted:
          return upsertMessage(prev, event.message);
        default:
          return prev;
      }
    });
  }, []);

  const { sendMessage, history } = useMessages({
    listener: onMessageEvent,
  });

  useEffect(() => {
    if (!history || historyLoaded) return;
    let cancelled = false;

    void history({ limit: 100, orderBy: OrderBy.OldestFirst }).then(
      (result) => {
        if (cancelled) return;
        setMessages(sortMessages(result.items));
        setHistoryLoaded(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [history, historyLoaded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const isLive = currentStatus === ConnectionStatus.Connected;

  const onSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || !me) return;
    setContent("");
    setSending(true);
    try {
      await sendMessage({
        text: trimmed,
        metadata: {
          email: me.email,
          fullName: me.fullName,
        },
      });
    } catch {
      setContent(trimmed);
      notifications.show({
        color: "red",
        title: "Send failed",
        message: "Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  if (!historyLoaded && messages.length === 0) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  return (
    <Card withBorder p={0} radius="md" className="flex flex-col">
      <ScrollArea viewportRef={scrollRef} h={520} type="auto">
        <Stack gap="md" p="md">
          {messages.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No messages yet. Start the conversation.
            </Text>
          ) : (
            messages.map((m) => {
              if (m.action === ChatMessageAction.MessageDelete) return null;
              const mine = m.clientId === me?.id;
              const label = displayLabel(m);
              return (
                <Group
                  key={m.serial}
                  align="flex-start"
                  gap="sm"
                  wrap="nowrap"
                  justify={mine ? "flex-end" : "flex-start"}
                >
                  {!mine && (
                    <Avatar color="brand" radius="xl" size="sm">
                      {initials(label)}
                    </Avatar>
                  )}
                  <Stack gap={2} className="max-w-[70%]">
                    <Group
                      gap="xs"
                      justify={mine ? "flex-end" : "flex-start"}
                    >
                      <Text size="xs" fw={500}>
                        {mine ? "You" : label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {m.timestamp.toLocaleString()}
                      </Text>
                    </Group>
                    <div
                      className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        mine
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </Stack>
                  {mine && (
                    <Avatar color="brand" radius="xl" size="sm">
                      {initials(label)}
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
                void onSend();
              }
            }}
            className="flex-1"
            disabled={!isLive}
          />
          <Button
            onClick={() => void onSend()}
            loading={sending}
            disabled={!content.trim() || !isLive}
          >
            Send
          </Button>
        </Group>
      </div>
    </Card>
  );
}

export function OrgChatConnectionBadge() {
  const { currentStatus } = useChatConnection();
  const isLive = currentStatus === ConnectionStatus.Connected;

  return (
    <Badge variant="dot" color={isLive ? "green" : "gray"} size="sm">
      {isLive ? "Live" : currentStatus}
    </Badge>
  );
}
