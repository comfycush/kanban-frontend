"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Anchor,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : "Invalid email",
      password: (value) =>
        value.length >= 8 ? null : "Password must be at least 8 characters",
    },
  });

  const onSubmit = form.onSubmit(async (values) => {
    try {
      await register.mutateAsync(values);
      notifications.show({
        color: "green",
        title: "Account created",
        message: "You are now signed in",
      });
      router.replace("/orgs");
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Registration failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to register. Try again.",
      });
    }
  });

  return (
    <Paper shadow="md" p="xl" radius="md" withBorder>
      <Stack gap="lg">
        <div>
          <Title order={2}>Create account</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Get started with your Kanban workspace
          </Text>
        </div>

        <form onSubmit={onSubmit}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="At least 8 characters"
              required
              {...form.getInputProps("password")}
            />
            <Button type="submit" loading={register.isPending} fullWidth mt="xs">
              Create account
            </Button>
          </Stack>
        </form>

        <Group justify="center" gap={4}>
          <Text size="sm" c="dimmed">
            Already have an account?
          </Text>
          <Anchor component={Link} href="/login" size="sm">
            Sign in
          </Anchor>
        </Group>
      </Stack>
    </Paper>
  );
}
