"use client";

import {
  ActionIcon,
  Button,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/types";

dayjs.extend(relativeTime);

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function notificationUrl(n: NotificationItem): string | null {
  const data = n.data;
  const str = (key: string): string | undefined => {
    const v = data[key];
    return typeof v === "string" ? v : undefined;
  };

  if (n.type === "INVITE") {
    const orgId = str("orgId");
    return orgId ? `/orgs/${orgId}` : null;
  }

  if (n.type === "CARD_ASSIGNED") {
    const orgId = str("orgId");
    const cardId = str("cardId");
    if (orgId && cardId) return `/orgs/${orgId}?card=${cardId}`;
    if (orgId) return `/orgs/${orgId}`;
    return null;
  }

  return null;
}

export function NotificationsBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.read).length;
  console.log({ notifications });

  return (
    <Popover width={360} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Indicator
          label={unreadCount > 9 ? "9+" : unreadCount}
          size={16}
          color="red"
          disabled={unreadCount === 0}
          offset={4}
        >
          <ActionIcon variant="subtle" size="lg" aria-label="Notifications">
            <BellIcon />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Group justify="space-between" p="sm" wrap="nowrap">
          <Title order={6}>Notifications</Title>
          {unreadCount > 0 ? (
            <Button
              variant="subtle"
              size="compact-xs"
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              Mark all read
            </Button>
          ) : null}
        </Group>
        <ScrollArea h={360} type="auto">
          {notifications.length === 0 ? (
            <Text c="dimmed" ta="center" size="sm" py="xl">
              No notifications yet
            </Text>
          ) : (
            <Stack gap={0} className="px-3">
              {notifications.map((n) => {
                const url = notificationUrl(n);
                const itemClass =
                  "px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left w-full";
                const inner = (
                  <Group gap="xs" align="flex-start" wrap="nowrap">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.read ? "bg-transparent" : "bg-blue-500"
                      }`}
                    />
                    <Stack gap={2} className="flex-1 min-w-0">
                      <Text size="sm" lineClamp={2}>
                        {n.message}
                      </Text>
                      <Group gap="xs" align="center">
                        <Text size="xs" c="dimmed">
                          {dayjs(n.createdAt).fromNow()}
                        </Text>
                        {url && (
                          <Text size="xs" c="blue" className="underline">
                            View →
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  </Group>
                );

                if (url) {
                  return (
                    <Link
                      key={n.id}
                      href={url}
                      className={itemClass}
                      onClick={() => !n.read && markRead.mutate(n.id)}
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <UnstyledButton
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={itemClass}
                  >
                    {inner}
                  </UnstyledButton>
                );
              })}
            </Stack>
          )}
        </ScrollArea>
      </Popover.Dropdown>
    </Popover>
  );
}
