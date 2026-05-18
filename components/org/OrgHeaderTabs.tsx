"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs } from "@mantine/core";

interface Props {
  orgId: string;
}

const tabs = [
  { value: "boards", label: "Boards", path: "" },
  { value: "members", label: "Members", path: "/members" },
  { value: "messages", label: "Messages", path: "/messages" },
  { value: "activity", label: "Activity", path: "/activity" },
] as const;

export function OrgHeaderTabs({ orgId }: Props) {
  const pathname = usePathname();
  const base = `/orgs/${orgId}`;

  const active =
    tabs.find((t) => {
      if (t.value === "boards") return pathname === base;
      return pathname?.startsWith(`${base}${t.path}`);
    })?.value ?? "boards";

  return (
    <Tabs value={active} variant="default">
      <Tabs.List>
        {tabs.map((t) => (
          <Tabs.Tab
            key={t.value}
            value={t.value}
            renderRoot={(props) => (
              <Link href={`${base}${t.path}`} {...props} />
            )}
          >
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
