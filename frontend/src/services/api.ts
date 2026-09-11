import type { ApiResponse } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit & { token?: string; params?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const { token, params, headers: customHeaders, ...fetchOptions } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        urlObj.searchParams.set(key, String(value));
      }
    }
    url = urlObj.toString();
  }

  const headers = new Headers(customHeaders);
  headers.set("Accept", "application/json");
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...fetchOptions, headers });
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    const errorMessage = json.error?.message || `HTTP Error ${response.status}`;
    const errorCode = json.error?.code || "UNKNOWN_ERROR";
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  return json.data as T;
}
