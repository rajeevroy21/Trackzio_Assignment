import { env } from "../config/env.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const REQUEST_TIMEOUT_MS = 8000;

export class TmdbConfigError extends Error {}
export class TmdbUnavailableError extends Error {}

function authHeaders(): Record<string, string> {
  const key = env.TMDB_API_KEY;
  if (!key) throw new TmdbConfigError("TMDB_API_KEY is not configured");
  return key.includes(".")
    ? { Authorization: `Bearer ${key}`, accept: "application/json" }
    : { accept: "application/json" };
}

function withKey(url: URL) {
  const key = env.TMDB_API_KEY;
  if (key && !key.includes(".")) url.searchParams.set("api_key", key);
  return url;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const url = withKey(new URL(TMDB_BASE + path));
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers: authHeaders(), signal: controller.signal });
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after") ?? 0);
        lastError = new TmdbUnavailableError(`TMDB responded ${res.status}`);
        await sleep(retryAfter ? retryAfter * 1000 : 300 * 2 ** attempt);
        continue;
      }
      if (res.status === 401) throw new TmdbConfigError("TMDB rejected the API key");
      if (res.status === 404) return null as T;
      if (!res.ok) throw new TmdbUnavailableError(`TMDB responded ${res.status}`);
      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof TmdbConfigError) throw error;
      lastError = error;
      await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new TmdbUnavailableError(String(lastError ?? "TMDB request failed"));
}

export type RawMovie = Record<string, unknown>;

export const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function img(path: unknown, size: string) {
  const p = str(path);
  return p ? `${IMG}/${size}${p}` : null;
}
