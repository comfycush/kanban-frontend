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
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

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
      await login.mutateAsync(values);
      notifications.show({
        color: "green",
        title: "Welcome back",
        message: "Logged in successfully",
      });
      router.replace("/orgs");
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Login failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to log in. Try again.",
      });
    }
  });

  return (
    <Paper shadow="md" p="xl" radius="md" withBorder>
      <Stack gap="lg">
        <div>
          <Title order={2}>Sign in</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Welcome back to your Kanban
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
              placeholder="Your password"
              required
              {...form.getInputProps("password")}
            />
            <Button type="submit" loading={login.isPending} fullWidth mt="xs">
              Sign in
            </Button>
          </Stack>
        </form>

        <Group justify="center" gap={4}>
          <Text size="sm" c="dimmed">
            No account?
          </Text>
          <Anchor component={Link} href="/register" size="sm">
            Create one
          </Anchor>
        </Group>
      </Stack>
    </Paper>
  );
}
