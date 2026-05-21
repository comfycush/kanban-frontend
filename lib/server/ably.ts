import Ably, { type TokenRequest } from "ably";

let restClient: Ably.Rest | null | undefined;

function getRest(): Ably.Rest | null {
  if (restClient !== undefined) {
    return restClient;
  }
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    console.warn("ABLY_API_KEY is not set; realtime publish is disabled");
    restClient = null;
    return null;
  }
  restClient = new Ably.Rest({ key });
  return restClient;
}

async function publish(
  channelName: string,
  eventName: string,
  data: unknown,
): Promise<void> {
  const rest = getRest();
  if (!rest) return;
  try {
    await rest.channels.get(channelName).publish(eventName, data);
  } catch (err) {
    console.warn(
      `Ably publish failed (${eventName} on ${channelName}):`,
      err,
    );
  }
}

export async function publishBoardEvent(
  boardId: string,
  payload: {
    type: string;
    cardId?: string;
    orgId?: string;
    card?: unknown;
  },
): Promise<void> {
  await publish(`board:${boardId}`, "board", payload);
}

export async function createAblyTokenRequest(
  clientId: string,
  capability: Record<string, string[]>,
): Promise<TokenRequest> {
  const rest = getRest();
  if (!rest) {
    throw new Error("Ably is not configured");
  }
  return rest.auth.createTokenRequest({
    clientId,
    capability: JSON.stringify(capability),
    ttl: 60 * 60 * 1000,
  });
}
