import { request } from "./fetcher";
import type { BoardWithColumns, MembershipWithOrg, UserPublic } from "../types";

export async function getUserFromToken(
  authHeader: Record<string, string>,
): Promise<UserPublic | null> {
  try {
    return await request<UserPublic>("GET", "/auth/me", {}, authHeader);
  } catch {
    return null;
  }
}

export async function buildSubscribeCapability(
  authHeader: Record<string, string>,
  orgIds: string[],
  boardIds: string[],
): Promise<Record<string, string[]>> {
  const capability: Record<string, string[]> = {};

  await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        await request<MembershipWithOrg>(
          "GET",
          `/memberships/${orgId}`,
          {},
          authHeader,
        );
        capability[`org:${orgId}`] = ["subscribe"];
      } catch {
        // user cannot access this org
      }
    }),
  );

  await Promise.all(
    boardIds.map(async (boardId) => {
      try {
        await request<BoardWithColumns>(
          "GET",
          `/boards/${boardId}`,
          {},
          authHeader,
        );
        capability[`board:${boardId}`] = ["subscribe"];
      } catch {
        // user cannot access this board
      }
    }),
  );

  return capability;
}

const CHAT_ROOM_OPS = [
  "publish",
  "subscribe",
  "history",
  "presence",
] as const;

export async function buildChatRoomCapability(
  authHeader: Record<string, string>,
  roomNames: string[],
): Promise<Record<string, string[]>> {
  const capability: Record<string, string[]> = {};

  await Promise.all(
    roomNames.map(async (roomName) => {
      if (!roomName.startsWith("org:")) return;
      const orgId = roomName.slice(4);
      try {
        await request<MembershipWithOrg>(
          "GET",
          `/memberships/${orgId}`,
          {},
          authHeader,
        );
        capability[roomName] = [...CHAT_ROOM_OPS];
      } catch {
        // user cannot access this org chat room
      }
    }),
  );

  return capability;
}
