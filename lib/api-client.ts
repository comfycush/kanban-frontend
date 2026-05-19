import { useAuthStore } from "./auth-store";
import { request } from "./server/fetcher";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// async function request<T>(
//   method: string,
//   path: string,
//   options: {
//     body?: unknown;
//     query?: Query;
//     formData?: FormData;
//     signal?: AbortSignal;
//   } = {},
// ): Promise<T> {
//   const headers: Record<string, string> = {
//     Accept: "application/json",
//     ...authHeader(),
//   };

//   let body: BodyInit | undefined;
//   if (options.formData) {
//     body = options.formData;
//   } else if (options.body !== undefined) {
//     headers["Content-Type"] = "application/json";
//     body = JSON.stringify(options.body);
//   }

//   const res = await fetch(buildUrl(path, options.query), {
//     method,
//     headers,
//     body,
//     signal: options.signal,
//   });

//   let json: ApiEnvelope<T> | { meta?: { message?: string } } | null = null;
//   try {
//     json = (await res.json()) as ApiEnvelope<T>;
//   } catch {
//     json = null;
//   }

//   if (!res.ok) {
//     if (res.status === 401) {
//       useAuthStore.getState().logout();
//     }
//     const message =
//       (json && "meta" in json && json.meta?.message) ||
//       `Request failed with status ${res.status}`;
//     throw new ApiError(message, res.status);
//   }

//   if (!json) {
//     throw new ApiError("Empty response body", res.status);
//   }

//   return (json as ApiEnvelope<T>).data;
// }

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>("GET", path, { query, signal }, authHeader()),
  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { body }, authHeader()),
  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }, authHeader()),
  put: <T>(path: string, body?: unknown) =>
    request<T>("PUT", path, { body }, authHeader()),
  delete: <T>(path: string) => request<T>("DELETE", path, {}, authHeader()),
  upload: <T>(path: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<T>("POST", path, { formData }, authHeader());
  },
};
