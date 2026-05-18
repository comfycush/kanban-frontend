"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type {
  CreateOrgDto,
  InviteUserDto,
  MembershipWithOrg,
  MembershipWithUser,
  Organization,
  OrgWithMembershipsAndUsers,
  Role,
  UpdateMemberRoleDto,
} from "@/lib/types";

export const orgsKeys = {
  all: ["orgs"] as const,
  list: () => [...orgsKeys.all, "list"] as const,
  detail: (orgId: string) => [...orgsKeys.all, "detail", orgId] as const,
  members: (orgId: string) => [...orgsKeys.all, "members", orgId] as const,
  myMembership: (orgId: string) =>
    ["memberships", "me", orgId] as const,
  myMemberships: ["memberships", "me"] as const,
};

export function useMyMemberships() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: orgsKeys.myMemberships,
    queryFn: () => api.get<MembershipWithOrg[]>("/memberships/me"),
    enabled: !!token,
  });
}

export function useOrg(orgId: string) {
  return useQuery({
    queryKey: orgsKeys.detail(orgId),
    queryFn: () => api.get<Organization>(`/orgs/${orgId}`),
    enabled: !!orgId,
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: orgsKeys.members(orgId),
    queryFn: () =>
      api.get<MembershipWithUser[]>(`/orgs/${orgId}/members`),
    enabled: !!orgId,
  });
}

export function useMyMembership(orgId: string) {
  return useQuery({
    queryKey: orgsKeys.myMembership(orgId),
    queryFn: () =>
      api.get<MembershipWithOrg>(`/memberships/${orgId}`),
    enabled: !!orgId,
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrgDto) =>
      api.post<OrgWithMembershipsAndUsers>("/orgs", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgsKeys.myMemberships });
    },
  });
}

export function useDeleteOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => api.delete<null>(`/orgs/${orgId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgsKeys.myMemberships });
    },
  });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteUserDto) =>
      api.post<MembershipWithUser>(`/orgs/${orgId}/invite`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgsKeys.members(orgId) });
    },
  });
}

export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; role: Role }) =>
      api.patch<MembershipWithUser>(
        `/orgs/${orgId}/members/${vars.userId}`,
        { role: vars.role } satisfies UpdateMemberRoleDto,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgsKeys.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<null>(`/orgs/${orgId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgsKeys.members(orgId) });
    },
  });
}
