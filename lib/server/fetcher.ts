"use server";
import { ApiError } from "../api-client";
import { ApiEnvelope } from "../types";

type Query = Record<string, string | number | boolean | undefined | null>;

const BASE_URL = process.env.API_URL ?? "http://localhost:3000";

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    query?: Query;
    formData?: FormData;
    signal?: AbortSignal;
  } = {},
  authHeader: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...authHeader,
  };

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body,
    signal: options.signal,
  });

  let json: ApiEnvelope<T> | { meta?: { message?: string } } | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }

  if (!res.ok) {
    // if (res.status === 401) {
    //   useAuthStore.getState().logout();
    // }
    const message =
      (json && "meta" in json && json.meta?.message) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  if (!json) {
    throw new ApiError("Empty response body", res.status);
  }

  return (json as ApiEnvelope<T>).data;
}
