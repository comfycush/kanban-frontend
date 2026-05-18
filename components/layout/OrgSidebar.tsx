"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  Loader,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useMyMemberships } from "@/hooks/use-orgs";

export function OrgSidebar() {
  const { data: memberships, isLoading } = useMyMemberships();
  const params = useParams<{ orgId?: string }>();
  const activeOrgId = params?.orgId;

  return (
    <Stack gap="md" className="h-full" p="sm">
      <div className="flex items-center justify-between px-2">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase">
          Organizations
        </Text>
        <Button
          component={Link}
          href="/orgs/new"
          size="compact-xs"
          variant="light"
        >
          New
        </Button>
      </div>

      <ScrollArea className="flex-1" type="auto">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader size="sm" />
          </div>
        ) : !memberships || memberships.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No organizations yet.
          </Text>
        ) : (
          <Stack gap={4}>
            {memberships.map((m) => (
              <NavLink
                key={m.orgId}
                component={Link}
                href={`/orgs/${m.orgId}`}
                label={m.org.name}
                active={m.orgId === activeOrgId}
                rightSection={
                  <Badge
                    size="xs"
                    variant="light"
                    color={m.role === "ADMIN" ? "blue" : "gray"}
                  >
                    {m.role}
                  </Badge>
                }
              />
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
