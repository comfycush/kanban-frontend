"use client";

import { useState } from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { Card as CardType, Column } from "@/lib/types";
import { useDeleteColumn, useUpdateColumn } from "@/hooks/use-columns";
import { useCreateCard } from "@/hooks/use-cards";
import { ApiError } from "@/lib/api-client";
import { KanbanCard } from "./KanbanCard";

interface Props {
  boardId: string;
  column: Column;
  cards: CardType[];
  onCardClick: (cardId: string) => void;
}

function DotsIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function GripIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="opacity-50"
    >
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

export function KanbanColumn({ boardId, column, cards, onCardClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const createCard = useCreateCard(boardId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === column.name) {
      setName(column.name);
      setEditing(false);
      return;
    }
    try {
      await updateColumn.mutateAsync({
        columnId: column.id,
        dto: { name: trimmed },
      });
      setEditing(false);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Rename failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
      setName(column.name);
      setEditing(false);
    }
  };

  const onDelete = () => {
    modals.openConfirmModal({
      title: `Delete "${column.name}"?`,
      children: (
        <Text size="sm">
          This will permanently delete the column and all of its cards.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteColumn.mutateAsync(column.id);
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

  const submitNewCard = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createCard.mutateAsync({
        columnId: column.id,
        dto: {
          title,
          description: newDescription.trim() || undefined,
        },
      });
      setNewTitle("");
      setNewDescription("");
      setAdding(false);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Add card failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-full"
    >
      <Group
        justify="space-between"
        wrap="nowrap"
        px="sm"
        py="xs"
        className="border-b border-zinc-200 dark:border-zinc-800"
      >
        <Group gap={6} wrap="nowrap" className="flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            type="button"
            aria-label="Drag column"
            className="cursor-grab active:cursor-grabbing p-1"
          >
            <GripIcon />
          </button>
          {editing ? (
            <TextInput
              value={name}
              size="xs"
              autoFocus
              onChange={(e) => setName(e.currentTarget.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setName(column.name);
                  setEditing(false);
                }
              }}
              className="flex-1"
            />
          ) : (
            <Text
              fw={600}
              size="sm"
              className="cursor-text truncate"
              onClick={() => setEditing(true)}
            >
              {column.name}
            </Text>
          )}
          <Badge size="xs" variant="light" color="gray">
            {cards.length}
          </Badge>
        </Group>
        <Menu position="bottom-end" withArrow shadow="md">
          <Menu.Target>
            <ActionIcon variant="subtle" size="sm">
              <DotsIcon />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setEditing(true)}>Rename</Menu.Item>
            <Menu.Item color="red" onClick={onDelete}>
              Delete column
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <div className="flex-1 overflow-y-auto p-2">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack gap="xs">
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onClick={() => onCardClick(card.id)}
              />
            ))}
          </Stack>
        </SortableContext>
      </div>

      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
        {adding ? (
          <Stack gap="xs">
            <TextInput
              size="xs"
              placeholder="Card title"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitNewCard();
                }
              }}
            />
            <Textarea
              size="xs"
              placeholder="Description (optional)"
              autosize
              minRows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.currentTarget.value)}
            />
            <Group gap="xs">
              <Button
                size="xs"
                onClick={submitNewCard}
                loading={createCard.isPending}
              >
                Add
              </Button>
              <Button
                size="xs"
                variant="default"
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                  setNewDescription("");
                }}
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        ) : (
          <Button
            size="xs"
            variant="subtle"
            fullWidth
            onClick={() => setAdding(true)}
          >
            + Add card
          </Button>
        )}
      </div>
    </div>
  );
}
