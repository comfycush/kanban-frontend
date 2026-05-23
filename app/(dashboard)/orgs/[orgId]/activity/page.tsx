"use client";

import { use } from "react";
import {
  Avatar,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Timeline,
  Title,
  Tooltip,
} from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useOrgActivity } from "@/hooks/use-boards";

dayjs.extend(relativeTime);

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export default function OrgActivityPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { data: activity, isLoading } = useOrgActivity(orgId);

  if (isLoading) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Center className="py-16">
        <Text c="dimmed">No activity yet</Text>
      </Center>
    );
  }

  return (
    <Card withBorder p="lg" radius="md" mt="md">
      <Stack gap="md">
        <Title order={4}>Recent activity</Title>
        <Timeline active={activity.length} bulletSize={28} lineWidth={2}>
          {activity.map((a) => (
            <Timeline.Item
              key={a.id}
              bullet={
                <Avatar color="brand" size={24} radius="xl">
                  {a.user ? initials(a.user.email) : "?"}
                </Avatar>
              }
              title={
                <Group gap="xs">
                  <Text fw={500} size="sm">
                    {a.user?.email ?? "Someone"}
                  </Text>
                  <Badge size="xs" variant="light">
                    {a.type.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                </Group>
              }
            >
              <Text size="sm" c="dimmed">
                {typeof a.data?.summary === "string"
                  ? a.data.summary
                  : a.type.replace(/_/g, " ").toLowerCase()}
              </Text>
              <Group justify="space-between">
                <Tooltip
                  label={dayjs(a.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  position="bottom-start"
                  openDelay={250}
                >
                  <Text size="xs" c="dimmed" mt={2}>
                    {dayjs(a.createdAt).fromNow()}
                  </Text>
                </Tooltip>
              </Group>
            </Timeline.Item>
          ))}
        </Timeline>
      </Stack>
    </Card>
  );
}
