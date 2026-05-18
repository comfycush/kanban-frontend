"use client";

import Link from "next/link";
import { use, useState } from "react";
import {
  Anchor,
  Breadcrumbs,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CardDetailModal } from "@/components/board/CardDetailModal";
import { useBoard } from "@/hooks/use-boards";
import { useBoardSocket } from "@/hooks/use-board-socket";
import { useMyMembership } from "@/hooks/use-orgs";

export default function BoardPage({
  params,
}: {
  params: Promise<{ orgId: string; boardId: string }>;
}) {
  const { orgId, boardId } = use(params);
  const { data: board, isLoading, error } = useBoard(boardId);
  const { data: membership } = useMyMembership(orgId);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Real-time board updates from other collaborators
  useBoardSocket(boardId);

  if (isLoading) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  if (error || !board) {
    return (
      <Center className="flex-1 py-16">
        <Stack gap="sm" align="center">
          <Text fw={500}>Board not found</Text>
          <Anchor component={Link} href={`/orgs/${orgId}`}>
            Back to boards
          </Anchor>
        </Stack>
      </Center>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-2rem)] w-full">
      <Stack gap="md" className="flex-1 min-h-0">
        <Group justify="space-between">
          <Stack gap={4}>
            <Breadcrumbs>
              <Anchor
                component={Link}
                href={`/orgs/${orgId}`}
                size="sm"
                c="dimmed"
              >
                {membership?.org.name ?? "Organization"}
              </Anchor>
              <Text size="sm">{board.name}</Text>
            </Breadcrumbs>
            <Title order={3}>{board.name}</Title>
          </Stack>
        </Group>

        <KanbanBoard board={board} onCardClick={setActiveCardId} />
      </Stack>

      <CardDetailModal
        cardId={activeCardId}
        boardId={boardId}
        orgId={orgId}
        onClose={() => setActiveCardId(null)}
      />
    </div>
  );
}
