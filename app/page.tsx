"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { useAuthStore } from "@/lib/auth-store";

export default function RootPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!hasHydrated) return;
    if (token) router.replace("/orgs");
    else router.replace("/login");
  }, [hasHydrated, token, router]);

  return (
    <Center className="flex-1">
      <Loader />
    </Center>
  );
}
