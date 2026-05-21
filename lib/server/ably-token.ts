"use server";

import type { TokenRequest } from "ably";
import {
  buildChatRoomCapability,
  buildSubscribeCapability,
  getUserFromToken,
} from "./ably-auth";
import { createAblyTokenRequest } from "./ably";

export async function getAblyToken(
  authToken: string,
  orgIds: string[],
  boardIds: string[],
  chatRoomIds: string[] = [],
): Promise<TokenRequest> {
  if (!authToken) {
    throw new Error("Unauthorized");
  }

  const authHeader = { Authorization: `Bearer ${authToken}` };
  const user = await getUserFromToken(authHeader);
  if (!user) {
    throw new Error("Unauthorized");
  }

  const [channelCapability, chatCapability] = await Promise.all([
    buildSubscribeCapability(authHeader, orgIds, boardIds),
    buildChatRoomCapability(authHeader, chatRoomIds),
  ]);
  const capability = { ...channelCapability, ...chatCapability };

  try {
    return await createAblyTokenRequest(user.id, capability);
  } catch {
    throw new Error("Ably is not configured");
  }
}
