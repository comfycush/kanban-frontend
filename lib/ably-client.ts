"use client";

import Ably, { type TokenRequest } from "ably";
import { getAblyToken } from "@/lib/server/ably-token";

interface ChannelInterest {
  boardIds: Set<string>;
}

interface ManagedClient {
  client: Ably.Realtime;
  refCount: number;
  interest: ChannelInterest;
  authToken: string;
}

const registry = new Map<string, ManagedClient>();

function registryKey(authToken: string) {
  return authToken;
}

function interestSnapshot(interest: ChannelInterest) {
  return {
    orgIds: [] as string[],
    boardIds: [...interest.boardIds],
  };
}

async function fetchTokenRequest(
  authToken: string,
  interest: ChannelInterest,
): Promise<TokenRequest> {
  const { orgIds, boardIds } = interestSnapshot(interest);
  return getAblyToken(authToken, orgIds, boardIds);
}

function getOrCreateClient(authToken: string): ManagedClient {
  const key = registryKey(authToken);
  const existing = registry.get(key);
  if (existing) {
    existing.refCount++;
    return existing;
  }

  const interest: ChannelInterest = { boardIds: new Set() };

  const client = new Ably.Realtime({
    authCallback: (_params, callback) => {
      fetchTokenRequest(authToken, interest)
        .then((tokenRequest) => callback(null, tokenRequest))
        .catch((err: Error) => callback(err.message, null));
    },
  });

  const entry: ManagedClient = { client, refCount: 1, interest, authToken };
  registry.set(key, entry);
  return entry;
}

async function ensureAuthorized(entry: ManagedClient) {
  const tokenRequest = await fetchTokenRequest(
    entry.authToken,
    entry.interest,
  );
  await entry.client.auth.authorize(tokenRequest);
}

export async function subscribeBoardChannel(
  authToken: string,
  boardId: string,
  handler: (data: unknown) => void,
): Promise<() => void> {
  const entry = getOrCreateClient(authToken);
  const channelName = `board:${boardId}`;
  const isNew = !entry.interest.boardIds.has(boardId);
  entry.interest.boardIds.add(boardId);

  if (isNew) {
    await ensureAuthorized(entry);
  }

  const channel = entry.client.channels.get(channelName);
  channel.subscribe("board", handler);

  return () => {
    channel.unsubscribe("board", handler);
    entry.interest.boardIds.delete(boardId);
  };
}

export function releaseAblyClient(authToken: string) {
  const key = registryKey(authToken);
  const entry = registry.get(key);
  if (!entry) return;
  entry.refCount--;
  if (entry.refCount <= 0) {
    entry.client.close();
    registry.delete(key);
  }
}
