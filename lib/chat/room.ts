/** Ably Chat room name for an organization's message channel. */
export function orgChatRoomName(orgId: string) {
  return `org:${orgId}`;
}
