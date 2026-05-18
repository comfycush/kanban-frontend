"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hasHydrated && token) {
      router.replace("/orgs");
    }
  }, [hasHydrated, token, router]);

  if (!hasHydrated) {
    return (
      <Center className="flex-1">
        <Loader />
      </Center>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
