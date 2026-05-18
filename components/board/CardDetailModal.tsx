"use client";

import { useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Divider,
  FileButton,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  useCard,
  useCardActivity,
  useCardAttachments,
  useDeleteAttachment,
  useDeleteCard,
  useUpdateCard,
  useUploadAttachment,
} from "@/hooks/use-cards";
import { useOrgMembers } from "@/hooks/use-orgs";
import { ApiError } from "@/lib/api-client";
import type { UpdateCardDto } from "@/lib/types";

dayjs.extend(relativeTime);

interface Props {
  cardId: string | null;
  boardId: string;
  orgId: string;
  onClose: () => void;
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function CardDetailModal({ cardId, boardId, orgId, onClose }: Props) {
  const opened = !!cardId;
  const { data: card, isLoading } = useCard(cardId ?? "");
  const { data: attachments } = useCardAttachments(cardId ?? "");
  const { data: activity } = useCardActivity(cardId ?? "");
  const { data: members } = useOrgMembers(orgId);

  const updateCard = useUpdateCard(cardId ?? "", boardId);
  const deleteCard = useDeleteCard(boardId);
  const uploadAttachment = useUploadAttachment(cardId ?? "");
  const deleteAttachment = useDeleteAttachment(cardId ?? "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  /** Tracks which card.id the text fields were last synced from */
  const [initializedForCardId, setInitializedForCardId] = useState<
    string | null
  >(null);

  // Reset local form state when modal closes (avoid effect-based setState).
  if (!opened && initializedForCardId !== null) {
    setInitializedForCardId(null);
    setTitle("");
    setDescription("");
    setAssignedToId(null);
  }

  // Hydrate fields when remote card arrives / switches (same pattern as KanbanBoard).
  if (
    opened &&
    card &&
    cardId &&
    card.id === cardId &&
    card.id !== initializedForCardId
  ) {
    setInitializedForCardId(card.id);
    setTitle(card.title);
    setDescription(card.description ?? "");
    setAssignedToId(card.assignedToId ?? null);
  }

  const isDirty = useMemo(() => {
    if (!card) return false;
    return (
      title.trim() !== card.title ||
      description !== (card.description ?? "") ||
      (assignedToId ?? null) !== (card.assignedToId ?? null)
    );
  }, [card, title, description, assignedToId]);

  const handleCancel = () => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description ?? "");
    setAssignedToId(card.assignedToId ?? null);
  };

  const handleSave = async () => {
    if (!card) return;
    const trimmed = title.trim();
    if (!trimmed) {
      notifications.show({
        color: "red",
        title: "Title required",
        message: "Add a title before saving.",
      });
      return;
    }

    const dto: UpdateCardDto = {};
    if (trimmed !== card.title) dto.title = trimmed;
    if (description !== (card.description ?? "")) dto.description = description;
    const nextAssignee = assignedToId ?? null;
    if (nextAssignee !== (card.assignedToId ?? null)) {
      dto.assignedToId = nextAssignee;
    }

    if (Object.keys(dto).length === 0) return;

    try {
      await updateCard.mutateAsync(dto);
      notifications.show({
        color: "green",
        title: "Saved",
        message: "Card updated",
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Save failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const onDeleteCard = () => {
    if (!card) return;
    modals.openConfirmModal({
      title: `Delete "${card.title}"?`,
      children: <Text size="sm">This will permanently delete the card.</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteCard.mutateAsync(card.id);
          onClose();
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

  const onFileSelect = async (file: File | null) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      notifications.show({
        color: "red",
        title: "File too large",
        message: "Max 20 MB",
      });
      return;
    }
    try {
      await uploadAttachment.mutateAsync(file);
      notifications.show({
        color: "green",
        title: "Uploaded",
        message: file.name,
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Upload failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const memberOptions =
    members?.map((m) => ({
      value: m.userId,
      label: m.user.email,
    })) ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={null}
      withCloseButton
      centered
      padding="lg"
    >
      {isLoading || !card ? (
        <div className="py-10 flex justify-center">
          <Loader />
        </div>
      ) : (
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <TextInput
              variant="unstyled"
              size="lg"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              className="flex-1 font-semibold"
              styles={{ input: { fontSize: 20, fontWeight: 600 } }}
            />
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              onClick={onDeleteCard}
              aria-label="Delete card"
            >
              <TrashIcon />
            </ActionIcon>
          </Group>

          {card.column ? (
            <Group gap="xs">
              <Badge variant="light">{card.column.name}</Badge>
              <Text size="xs" c="dimmed">
                Created {dayjs(card.createdAt).fromNow()}
              </Text>
            </Group>
          ) : null}

          <Select
            label="Assignee"
            placeholder="Unassigned"
            clearable
            data={memberOptions}
            value={assignedToId}
            onChange={setAssignedToId}
            searchable
          />

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Description
            </Text>
            <Textarea
              autosize
              minRows={4}
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
          </Stack>

          <Divider />

          <Tabs defaultValue="attachments">
            <Tabs.List>
              <Tabs.Tab value="attachments">
                Attachments ({attachments?.length ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="activity">
                Activity ({activity?.length ?? 0})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="attachments" pt="sm">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Title order={6}>Attachments</Title>
                  <FileButton onChange={onFileSelect}>
                    {(props) => (
                      <Button
                        size="xs"
                        variant="light"
                        loading={uploadAttachment.isPending}
                        {...props}
                      >
                        Upload
                      </Button>
                    )}
                  </FileButton>
                </Group>
                {attachments && attachments.length > 0 ? (
                  <Stack gap={4}>
                    {attachments.map((att) => (
                      <Group
                        key={att.id}
                        justify="space-between"
                        wrap="nowrap"
                        className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
                      >
                        <Stack gap={0} className="min-w-0 flex-1">
                          <Anchor
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                            truncate
                          >
                            {att.fileName}
                          </Anchor>
                          <Text size="xs" c="dimmed">
                            {dayjs(att.createdAt).fromNow()}
                          </Text>
                        </Stack>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => deleteAttachment.mutate(att.id)}
                          aria-label="Delete attachment"
                        >
                          <TrashIcon />
                        </ActionIcon>
                      </Group>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    No attachments yet.
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="activity" pt="sm">
              <ScrollArea h={240}>
                {activity && activity.length > 0 ? (
                  <Stack gap="xs">
                    {activity.map((a) => (
                      <Stack key={a.id} gap={2}>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {a.user?.email ?? "Someone"}
                          </Text>
                          <Badge size="xs" variant="light">
                            {a.type.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {typeof a.data?.summary === "string"
                            ? a.data.summary
                            : ""}{" "}
                          · {dayjs(a.createdAt).fromNow()}
                        </Text>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    No activity yet.
                  </Text>
                )}
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>

          <Divider />

          <Group justify="flex-end" gap="sm" mt="xs">
            <Button
              variant="default"
              onClick={handleCancel}
              disabled={!isDirty || updateCard.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateCard.isPending}
              loading={updateCard.isPending}
            >
              Save
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
