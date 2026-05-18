import { io, type Socket } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Singleton sockets keyed by namespace+token so they are reused across hook
// mounts and torn down when all consumers disconnect.

interface ManagedSocket {
  socket: Socket;
  refCount: number;
}

const registry = new Map<string, ManagedSocket>();

function registryKey(namespace: string, token: string) {
  return `${namespace}::${token}`;
}

export function getSocket(namespace: string, token: string): Socket {
  const key = registryKey(namespace, token);
  const existing = registry.get(key);
  if (existing) {
    existing.refCount++;
    return existing.socket;
  }

  const socket = io(`${BASE_URL}${namespace}`, {
    auth: { token },
    transports: ["websocket"],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  registry.set(key, { socket, refCount: 1 });
  return socket;
}

export function releaseSocket(namespace: string, token: string) {
  const key = registryKey(namespace, token);
  const entry = registry.get(key);
  if (!entry) return;
  entry.refCount--;
  if (entry.refCount <= 0) {
    entry.socket.disconnect();
    registry.delete(key);
  }
}
