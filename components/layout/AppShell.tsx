"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  AppShell as MantineAppShell,
  Avatar,
  Burger,
  Group,
  Menu,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useLogout, useMe } from "@/hooks/use-auth";
import { NotificationsBell } from "./NotificationsBell";
import { OrgSidebar } from "./OrgSidebar";

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const { data: user } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <UnstyledButton component={Link} href="/orgs">
              <Group gap="xs">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  K
                </div>
                <Title order={4} className="hidden sm:block">
                  Kanban
                </Title>
              </Group>
            </UnstyledButton>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <NotificationsBell />
            <UnstyledButton
              onClick={() =>
                setColorScheme(colorScheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
              className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {colorScheme === "dark" ? <SunIcon /> : <MoonIcon />}
            </UnstyledButton>
            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <UnstyledButton>
                  <Avatar color="brand" radius="xl" size="sm">
                    {user?.email ? initials(user.email) : "??"}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text>{user?.fullName}</Text>
                  <Text size="xs" truncate>
                    {user?.email}
                  </Text>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item color="red" onClick={handleLogout}>
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        <OrgSidebar />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main className="flex flex-col">
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
