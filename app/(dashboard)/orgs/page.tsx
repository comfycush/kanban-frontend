"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import dayjs from "dayjs";
import { useMyMemberships } from "@/hooks/use-orgs";

export default function OrgsIndexPage() {
  const router = useRouter();
  const { data: memberships, isLoading } = useMyMemberships();

  useEffect(() => {
    if (!isLoading && memberships && memberships.length === 0) {
      router.replace("/orgs/new");
    }
  }, [memberships, isLoading, router]);

  if (isLoading) {
    return (
      <Center className="flex-1">
        <Loader />
      </Center>
    );
  }

  return (
    <Container size="lg" py="lg" className="w-full">
      <Stack gap="xl">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Title order={2}>Your organizations</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Choose an organization to view its boards
            </Text>
          </div>
          <Button component={Link} href="/orgs/new">
            New organization
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {(memberships ?? []).map((m) => (
            <Card
              key={m.orgId}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              component={Link}
              href={`/orgs/${m.orgId}`}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Title order={4} lineClamp={1}>
                    {m.org.name}
                  </Title>
                  <Badge
                    variant="light"
                    color={m.role === "ADMIN" ? "blue" : "gray"}
                  >
                    {m.role}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  Created {dayjs(m.org.createdAt).format("MMM D, YYYY")}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
