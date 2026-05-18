"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useCreateOrg } from "@/hooks/use-orgs";
import { ApiError } from "@/lib/api-client";

export default function NewOrgPage() {
  const router = useRouter();
  const createOrg = useCreateOrg();

  const form = useForm({
    initialValues: { name: "" },
    validate: {
      name: (value) =>
        value.trim().length === 0
          ? "Name is required"
          : value.length > 200
            ? "Max 200 characters"
            : null,
    },
  });

  const onSubmit = form.onSubmit(async (values) => {
    try {
      const org = await createOrg.mutateAsync(values);
      notifications.show({
        color: "green",
        title: "Organization created",
        message: org.name,
      });
      router.replace(`/orgs/${org.id}`);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Could not create organization",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  });

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack gap="lg">
          <div>
            <Title order={3}>Create an organization</Title>
            <Text size="sm" c="dimmed" mt={4}>
              Organizations group together your boards and teammates.
            </Text>
          </div>

          <form onSubmit={onSubmit}>
            <Stack gap="md">
              <TextInput
                label="Organization name"
                placeholder="Acme Inc."
                required
                {...form.getInputProps("name")}
              />
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="default"
                  onClick={() => router.back()}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={createOrg.isPending}>
                  Create
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
