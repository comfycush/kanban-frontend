"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/login");
    }
  }, [hasHydrated, token, router]);

  if (!hasHydrated || !token) {
    return (
      <Center className="flex-1 min-h-screen w-full">
        <Loader />
      </Center>
    );
  }

  return <AppShell>{children}</AppShell>;
}
