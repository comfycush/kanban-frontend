"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Button, Group, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { BoardWithColumns, Card as CardType, Column } from "@/lib/types";
import { useReorderColumns } from "@/hooks/use-columns";
import { useMoveCard } from "@/hooks/use-cards";
import { useCreateColumn } from "@/hooks/use-columns";
import { ApiError } from "@/lib/api-client";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCardOverlay } from "./KanbanCard";

interface Props {
  board: BoardWithColumns;
  onCardClick: (cardId: string) => void;
}

interface DragState {
  cardId: string | null;
  columnId: string | null;
}

export function KanbanBoard({ board, onCardClick }: Props) {
  const [columns, setColumns] = useState<Column[]>(() =>
    toSortedColumns(board),
  );
  const [prevBoard, setPrevBoard] = useState(board);
  const [isDragging, setIsDragging] = useState(false);

  // Avoid effect-driven setState (cascade renders). Sync when server board changes,
  // but skip during drag so optimistic UI isn't overwritten mid-interaction.
  if (board !== prevBoard && !isDragging) {
    setPrevBoard(board);
    setColumns(toSortedColumns(board));
  }

  const [drag, setDrag] = useState<DragState>({
    cardId: null,
    columnId: null,
  });
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const reorderColumns = useReorderColumns(board.id);
  const moveCard = useMoveCard(board.id, board.orgId);
  const createColumn = useCreateColumn(board.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const allCards = useMemo(() => {
    const map = new Map<string, CardType>();
    columns.forEach((col) =>
      (col.cards ?? []).forEach((card) => map.set(card.id, card)),
    );
    return map;
  }, [columns]);

  const activeCard =
    drag.cardId !== null ? allCards.get(drag.cardId) : undefined;

  const findColumnForCard = (cardId: string): Column | undefined =>
    columns.find((col) => (col.cards ?? []).some((c) => c.id === cardId));

  const onDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const data = event.active.data.current;
    if (data?.type === "column") {
      setDrag({ cardId: null, columnId: event.active.id as string });
    } else if (data?.type === "card") {
      setDrag({ cardId: event.active.id as string, columnId: null });
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    if (active.data.current?.type !== "card") return;

    const activeColumn = findColumnForCard(active.id as string);
    if (!activeColumn) return;

    const overData = over.data.current;
    let targetColumn: Column | undefined;
    if (overData?.type === "card") {
      targetColumn = findColumnForCard(over.id as string);
    } else if (overData?.type === "column") {
      targetColumn = columns.find((c) => c.id === over.id);
    }
    if (!targetColumn) return;
    if (activeColumn.id === targetColumn.id) return;

    setColumns((prev) => {
      const activeIdx = prev.findIndex((c) => c.id === activeColumn.id);
      const targetIdx = prev.findIndex((c) => c.id === targetColumn.id);
      if (activeIdx < 0 || targetIdx < 0) return prev;

      const activeCards = [...(prev[activeIdx].cards ?? [])];
      const targetCards = [...(prev[targetIdx].cards ?? [])];
      const cardIdx = activeCards.findIndex((c) => c.id === active.id);
      if (cardIdx < 0) return prev;
      const [moved] = activeCards.splice(cardIdx, 1);
      const movedUpdated = { ...moved, columnId: targetColumn.id };

      let insertAt = targetCards.length;
      if (overData?.type === "card") {
        const overIdx = targetCards.findIndex((c) => c.id === over.id);
        if (overIdx >= 0) insertAt = overIdx;
      }
      targetCards.splice(insertAt, 0, movedUpdated);

      const next = [...prev];
      next[activeIdx] = { ...prev[activeIdx], cards: activeCards };
      next[targetIdx] = { ...prev[targetIdx], cards: targetCards };
      return next;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeType = active.data.current?.type;

    setIsDragging(false);
    setDrag({ cardId: null, columnId: null });

    if (!over) return;

    if (activeType === "column") {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      reorderColumns.mutate(
        { columnIds: next.map((c) => c.id) },
        {
          onError: (error) => {
            notifications.show({
              color: "red",
              title: "Reorder failed",
              message:
                error instanceof ApiError ? error.message : "Please try again.",
            });
          },
        },
      );
      return;
    }

    if (activeType === "card") {
      const targetColumn = findColumnForCard(active.id as string);
      if (!targetColumn) return;

      let newOrder = (targetColumn.cards ?? []).findIndex(
        (c) => c.id === active.id,
      );

      // Reorder within same column when dropping on another card
      const overType = over.data.current?.type;
      if (overType === "card" && active.id !== over.id) {
        const overColumn = findColumnForCard(over.id as string);
        if (overColumn && overColumn.id === targetColumn.id) {
          const cards = targetColumn.cards ?? [];
          const oldIndex = cards.findIndex((c) => c.id === active.id);
          const newIndex = cards.findIndex((c) => c.id === over.id);
          if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
            const reordered = arrayMove(cards, oldIndex, newIndex);
            setColumns((prev) =>
              prev.map((c) =>
                c.id === targetColumn.id ? { ...c, cards: reordered } : c,
              ),
            );
            newOrder = newIndex;
          }
        }
      }

      moveCard.mutate(
        {
          cardId: active.id as string,
          dto: { targetColumnId: targetColumn.id, newOrder },
        },
        {
          onError: (error) => {
            notifications.show({
              color: "red",
              title: "Move failed",
              message:
                error instanceof ApiError ? error.message : "Please try again.",
            });
          },
        },
      );
    }
  };

  const submitNewColumn = async () => {
    const name = newColumnName.trim();
    if (!name) return;
    try {
      await createColumn.mutateAsync({ name });
      setNewColumnName("");
      setAddingColumn(false);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Add column failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-1 items-start">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                boardId={board.id}
                column={col}
                cards={col.cards ?? []}
                onCardClick={onCardClick}
              />
            ))}
          </SortableContext>

          <div className="w-72 shrink-0">
            {addingColumn ? (
              <Stack
                gap="xs"
                className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-2"
              >
                <TextInput
                  size="xs"
                  placeholder="Column name"
                  autoFocus
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitNewColumn();
                    }
                  }}
                />
                <Group gap="xs">
                  <Button
                    size="xs"
                    onClick={submitNewColumn}
                    loading={createColumn.isPending}
                  >
                    Add
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => {
                      setAddingColumn(false);
                      setNewColumnName("");
                    }}
                  >
                    Cancel
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Button
                variant="subtle"
                fullWidth
                onClick={() => setAddingColumn(true)}
              >
                + Add column
              </Button>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? <KanbanCardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function toSortedColumns(board: BoardWithColumns): Column[] {
  return sortByOrder(board.columns).map((c) => ({
    ...c,
    cards: sortByOrder(c.cards ?? []),
  }));
}
