"use client";

import { useState, type ReactNode } from "react";
import {
  MantineProvider,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const brand: MantineColorsTuple = [
  "#eef3ff",
  "#dde4f7",
  "#b6c5ee",
  "#8da4e5",
  "#6b87de",
  "#5675d9",
  "#4a6cd8",
  "#3a5cc1",
  "#3252ad",
  "#284898",
];

const theme = createTheme({
  primaryColor: "brand",
  colors: { brand },
  defaultRadius: "md",
  fontFamily:
    "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily:
      "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <Notifications position="top-right" />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
