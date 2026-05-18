"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Stack, Text } from "@mantine/core";
import type { Card as CardType } from "@/lib/types";

interface Props {
  card: CardType;
  onClick: () => void;
}

export function KanbanCard({ card, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        // Avoid triggering on drag handle release if any movement was meaningful
        e.stopPropagation();
        onClick();
      }}
    >
      <Card
        shadow="xs"
        padding="sm"
        radius="md"
        withBorder
        className="cursor-pointer hover:shadow-md transition-shadow"
      >
        <Stack gap={4}>
          <Text fw={500} size="sm" lineClamp={3}>
            {card.title}
          </Text>
          {card.description ? (
            <Text size="xs" c="dimmed" lineClamp={2}>
              {card.description}
            </Text>
          ) : null}
        </Stack>
      </Card>
    </div>
  );
}

export function KanbanCardOverlay({ card }: { card: CardType }) {
  return (
    <Card shadow="lg" padding="sm" radius="md" withBorder className="rotate-2">
      <Stack gap={4}>
        <Text fw={500} size="sm" lineClamp={3}>
          {card.title}
        </Text>
        {card.description ? (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {card.description}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
