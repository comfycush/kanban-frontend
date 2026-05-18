"use client";

import { use } from "react";
import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { BoardCard } from "@/components/org/BoardCard";
import { useBoards, useCreateBoard } from "@/hooks/use-boards";
import { useMyMembership } from "@/hooks/use-orgs";
import { ApiError } from "@/lib/api-client";

export default function OrgBoardsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { data: boards, isLoading } = useBoards(orgId);
  const { data: membership } = useMyMembership(orgId);
  const isAdmin = membership?.role === "ADMIN";
  const createBoard = useCreateBoard(orgId);
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: { name: "" },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? "Name is required" : null,
    },
  });

  const onSubmit = form.onSubmit(async (values) => {
    try {
      await createBoard.mutateAsync(values);
      notifications.show({
        color: "green",
        title: "Board created",
        message: values.name,
      });
      form.reset();
      close();
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Create failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  });

  if (isLoading) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg" mt="md">
      <Group justify="space-between">
        <Title order={4}>Boards</Title>
        {isAdmin ? (
          <Button onClick={open}>New board</Button>
        ) : null}
      </Group>

      {boards && boards.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} canManage={isAdmin} />
          ))}
        </SimpleGrid>
      ) : (
        <Center className="py-16">
          <Stack gap="sm" align="center">
            <Text size="lg" fw={500}>
              No boards yet
            </Text>
            <Text size="sm" c="dimmed">
              {isAdmin
                ? "Create your first board to get started."
                : "Ask an admin to create a board."}
            </Text>
            {isAdmin ? (
              <Button mt="sm" onClick={open}>
                Create board
              </Button>
            ) : null}
          </Stack>
        </Center>
      )}

      <Modal opened={opened} onClose={close} title="Create board" centered>
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            <TextInput
              label="Board name"
              placeholder="Sprint 1"
              required
              data-autofocus
              {...form.getInputProps("name")}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={close} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={createBoard.isPending}>
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
