"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPublic } from "./types";

interface AuthState {
  token: string | null;
  user: UserPublic | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: UserPublic) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserPublic | null) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "kanban-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
