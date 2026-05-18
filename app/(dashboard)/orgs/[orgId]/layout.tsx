"use client";

import { use, type ReactNode } from "react";
import {
  Badge,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Title,
} from "@mantine/core";
import { OrgHeaderTabs } from "@/components/org/OrgHeaderTabs";
import { useMyMembership } from "@/hooks/use-orgs";

export default function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { data: membership, isLoading } = useMyMembership(orgId);

  if (isLoading) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  return (
    <Container size="xl" py="lg" className="w-full flex-1 flex flex-col">
      <Stack gap="md" className="flex-1">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <Title order={2}>{membership?.org.name ?? "Organization"}</Title>
            {membership ? (
              <Badge
                variant="light"
                color={membership.role === "ADMIN" ? "blue" : "gray"}
              >
                {membership.role}
              </Badge>
            ) : null}
          </Group>
        </Group>
        <OrgHeaderTabs orgId={orgId} />
        <div className="flex-1 flex flex-col">{children}</div>
      </Stack>
    </Container>
  );
}
