"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type {
  LoginDto,
  LoginResponse,
  RegisterDto,
  RegisterResponse,
  UserPublic,
} from "@/lib/types";

export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<UserPublic>("/auth/me"),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<LoginResponse>("/auth/login", dto),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterDto) =>
      api.post<RegisterResponse>("/auth/register", dto),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  return () => {
    logout();
    queryClient.clear();
  };
}
