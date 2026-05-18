"use client";

import Link from "next/link";
import {
  ActionIcon,
  Card,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import type { Board } from "@/lib/types";
import { useDeleteBoard } from "@/hooks/use-boards";
import { ApiError } from "@/lib/api-client";

interface Props {
  board: Board;
  canManage: boolean;
}

function DotsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

export function BoardCard({ board, canManage }: Props) {
  const deleteBoard = useDeleteBoard(board.orgId);

  const onDelete = () => {
    modals.openConfirmModal({
      title: `Delete "${board.name}"?`,
      children: (
        <Text size="sm">
          This will permanently delete the board and all its columns/cards.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteBoard.mutateAsync(board.id);
          notifications.show({
            color: "green",
            title: "Board deleted",
            message: board.name,
          });
        } catch (error) {
          notifications.show({
            color: "red",
            title: "Delete failed",
            message:
              error instanceof ApiError ? error.message : "Please try again.",
          });
        }
      },
    });
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="hover:shadow-md transition-shadow"
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Link
            href={`/orgs/${board.orgId}/boards/${board.id}`}
            className="hover:underline min-w-0 flex-1"
          >
            <Title order={5} lineClamp={1}>
              {board.name}
            </Title>
          </Link>
          {canManage ? (
            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <DotsIcon />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item color="red" onClick={onDelete}>
                  Delete board
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
        <Text size="xs" c="dimmed">
          Created {dayjs(board.createdAt).format("MMM D, YYYY")}
        </Text>
      </Stack>
    </Card>
  );
}
