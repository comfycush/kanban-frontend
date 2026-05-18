"use client";

import { use } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import {
  useInviteMember,
  useMyMembership,
  useOrgMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/use-orgs";
import { ApiError } from "@/lib/api-client";
import type { Role } from "@/lib/types";

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function DotsIcon() {
  return (
    <svg
      width="16"
      height="16"
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

export default function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { data: members, isLoading } = useOrgMembers(orgId);
  const { data: myMembership } = useMyMembership(orgId);
  const isAdmin = myMembership?.role === "ADMIN";

  const invite = useInviteMember(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);

  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: { email: "", role: "MEMBER" as Role },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : "Invalid email",
    },
  });

  const onInvite = form.onSubmit(async (values) => {
    try {
      await invite.mutateAsync({ email: values.email, role: values.role });
      notifications.show({
        color: "green",
        title: "Member invited",
        message: values.email,
      });
      form.reset();
      close();
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Invite failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  });

  const onRoleChange = async (userId: string, role: Role) => {
    try {
      await updateRole.mutateAsync({ userId, role });
      notifications.show({
        color: "green",
        title: "Role updated",
        message: `Now ${role}`,
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Update failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const onRemove = (userId: string, email: string) => {
    modals.openConfirmModal({
      title: `Remove ${email}?`,
      children: (
        <Text size="sm">
          This will revoke their access to the organization.
        </Text>
      ),
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await removeMember.mutateAsync(userId);
          notifications.show({
            color: "green",
            title: "Member removed",
            message: email,
          });
        } catch (error) {
          notifications.show({
            color: "red",
            title: "Remove failed",
            message:
              error instanceof ApiError ? error.message : "Please try again.",
          });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <Center className="flex-1 min-h-[40vh]">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md" mt="md">
      <Group justify="space-between">
        <Title order={4}>Members</Title>
        {isAdmin ? <Button onClick={open}>Invite member</Button> : null}
      </Group>

      <Table verticalSpacing="sm" highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th style={{ width: 40 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(members ?? []).map((m) => (
            <Table.Tr key={m.id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar color="brand" radius="xl" size="sm">
                    {initials(m.user.email)}
                  </Avatar>
                  <Text size="sm">{m.user.email}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge
                  variant="light"
                  color={m.role === "ADMIN" ? "blue" : "gray"}
                >
                  {m.role}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {dayjs(m.createdAt).format("MMM D, YYYY")}
                </Text>
              </Table.Td>
              <Table.Td>
                {isAdmin && m.userId !== myMembership?.userId ? (
                  <Menu position="bottom-end" withArrow shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm">
                        <DotsIcon />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {m.role === "ADMIN" ? (
                        <Menu.Item
                          onClick={() => onRoleChange(m.userId, "MEMBER")}
                        >
                          Demote to Member
                        </Menu.Item>
                      ) : (
                        <Menu.Item
                          onClick={() => onRoleChange(m.userId, "ADMIN")}
                        >
                          Promote to Admin
                        </Menu.Item>
                      )}
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        onClick={() => onRemove(m.userId, m.user.email)}
                      >
                        Remove
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Invite member" centered>
        <form onSubmit={onInvite}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="teammate@example.com"
              required
              data-autofocus
              {...form.getInputProps("email")}
            />
            <Select
              label="Role"
              data={[
                { value: "MEMBER", label: "Member" },
                { value: "ADMIN", label: "Admin" },
              ]}
              {...form.getInputProps("role")}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={close} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={invite.isPending}>
                Send invite
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
