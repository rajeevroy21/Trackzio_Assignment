// Server-only TMDB access layer.
//
// Responsibilities:
//  - keep the TMDB credential on the server (the browser never talks to TMDB)
//  - normalise TMDB payloads into the app's own shape (tmdb-types.ts)
//  - cache responses in Postgres so repeated/identical requests are cheap and
//    so we can serve stale data when TMDB is slow, rate limited or down
//  - bound every upstream call with a timeout and a small retry budget

import type { Genre, MovieDetail, MoviePage, MovieSummary } from "./tmdb-types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const REQUEST_TIMEOUT_MS = 8000;

export class TmdbConfigError extends Error {}
export class TmdbUnavailableError extends Error {}

type CacheRow = { payload: unknown; expires_at: string };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readCache(key: string): Promise<{ payload: unknown; fresh: boolean } | null> {
  try {
    const db = await admin();
    const { data } = await db
      .from("tmdb_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle<CacheRow>();
    if (!data) return null;
    return { payload: data.payload, fresh: new Date(data.expires_at).getTime() > Date.now() };
  } catch {
    // A cache miss must never break a request.
    return null;
  }
}

async function writeCache(key: string, payload: unknown, ttlSeconds: number) {
  try {
    const db = await admin();
    await db.from("tmdb_cache").upsert({
      cache_key: key,
      payload: payload as never,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
  } catch {
    // Caching is best-effort.
  }
}

function authHeaders(): Record<string, string> {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new TmdbConfigError("TMDB_API_KEY is not configured");
  // Support both v4 read-access tokens (JWT-ish, sent as bearer) and v3 keys.
  return key.includes(".")
    ? { Authorization: `Bearer ${key}`, accept: "application/json" }
    : { accept: "application/json" };
}

function withKey(url: URL) {
  const key = process.env["TMDB_API_KEY"];
  if (key && !key.includes(".")) url.searchParams.set("api_key", key);
  return url;
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>) {
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
        // Rate limited or upstream trouble: back off, then retry.
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch through the cache. Falls back to stale cache when TMDB misbehaves. */
async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<{ value: T; stale: boolean }> {
  const hit = await readCache(key);
  if (hit?.fresh) return { value: hit.payload as T, stale: false };
  try {
    const value = await load();
    await writeCache(key, value, ttlSeconds);
    return { value, stale: false };
  } catch (error) {
    if (hit) return { value: hit.payload as T, stale: true };
    throw error;
  }
}

// ---------- normalisation (TMDB payloads are frequently incomplete) ----------

type RawMovie = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function img(path: unknown, size: string) {
  const p = str(path);
  return p ? `${IMG}/${size}${p}` : null;
}

export function normaliseMovie(raw: RawMovie): MovieSummary | null {
  const id = num(raw["id"]);
  const title = str(raw["title"]) ?? str(raw["original_title"]) ?? str(raw["name"]);
  if (id === null || !title) return null; // unusable record — drop it
  const releaseDate = str(raw["release_date"]);
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : NaN;
  return {
    id,
    title,
    overview: str(raw["overview"]) ?? "",
    posterUrl: img(raw["poster_path"], "w500"),
    backdropUrl: img(raw["backdrop_path"], "w1280"),
    releaseDate,
    releaseYear: Number.isFinite(year) ? year : null,
    rating: num(raw["vote_average"]),
    voteCount: num(raw["vote_count"]) ?? 0,
    genreIds: Array.isArray(raw["genre_ids"])
      ? (raw["genre_ids"] as unknown[]).filter((g): g is number => typeof g === "number")
      : [],
  };
}

function normalisePage(raw: RawMovie | null): MoviePage {
  const results = Array.isArray(raw?.["results"]) ? (raw["results"] as RawMovie[]) : [];
  return {
    items: results.map(normaliseMovie).filter((m): m is MovieSummary => m !== null),
    page: num(raw?.["page"]) ?? 1,
    // TMDB refuses pages beyond 500.
    totalPages: Math.min(num(raw?.["total_pages"]) ?? 1, 500),
    totalResults: num(raw?.["total_results"]) ?? 0,
  };
}

// ---------------------------- public server API ----------------------------

export type BrowseParams = {
  query?: string;
  genreId?: number;
  sort?: string;
  minRating?: number;
  year?: number;
  page?: number;
};

export async function browseMovies(params: BrowseParams): Promise<MoviePage> {
  const page = Math.min(Math.max(params.page ?? 1, 1), 500);
  const query = params.query?.trim() ?? "";
  const key = `browse:${JSON.stringify({ ...params, page, query })}`;
  // Searches change less often than they are repeated: 5 min for search,
  // 30 min for curated browsing.
  const ttl = query ? 300 : 1800;

  const { value, stale } = await cached<MoviePage>(key, ttl, async () => {
    if (query) {
      const raw = await tmdbFetch<RawMovie>("/search/movie", {
        query,
        page,
        include_adult: "false",
        language: "en-US",
      });
      const normalised = normalisePage(raw);
      // TMDB search cannot sort server-side, so ordering is applied here.
      return { ...normalised, items: sortItems(normalised.items, params.sort) };
    }
    const raw = await tmdbFetch<RawMovie>("/discover/movie", {
      page,
      sort_by: params.sort ?? "popularity.desc",
      include_adult: "false",
      language: "en-US",
      with_genres: params.genreId,
      "vote_average.gte": params.minRating,
      primary_release_year: params.year,
      // Keeps "highest rated" from being won by films with 3 votes.
      "vote_count.gte": params.sort === "vote_average.desc" ? 300 : undefined,
    });
    return normalisePage(raw);
  });

  return stale ? { ...value, stale: true } : value;
}

function sortItems(items: MovieSummary[], sort?: string) {
  const copy = [...items];
  switch (sort) {
    case "vote_average.desc":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "primary_release_date.desc":
      return copy.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
    case "primary_release_date.asc":
      return copy.sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"));
    case "title.asc":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy;
  }
}

export async function getGenres(): Promise<Genre[]> {
  const { value } = await cached<Genre[]>("genres:en", 60 * 60 * 24, async () => {
    const raw = await tmdbFetch<RawMovie>("/genre/movie/list", { language: "en-US" });
    const list = Array.isArray(raw?.["genres"]) ? (raw["genres"] as RawMovie[]) : [];
    return list
      .map((g) => ({ id: num(g["id"]), name: str(g["name"]) }))
      .filter((g): g is Genre => g.id !== null && g.name !== null);
  });
  return value;
}

export async function getMovieDetail(id: number): Promise<MovieDetail | null> {
  const { value } = await cached<MovieDetail | null>(`movie:${id}`, 60 * 60 * 6, async () => {
    const raw = await tmdbFetch<RawMovie>(`/movie/${id}`, {
      language: "en-US",
      append_to_response: "credits,similar",
    });
    if (!raw) return null;
    const base = normaliseMovie(raw);
    if (!base) return null;

    const credits = (raw["credits"] ?? {}) as RawMovie;
    const castRaw = Array.isArray(credits["cast"]) ? (credits["cast"] as RawMovie[]) : [];
    const similarRaw = (raw["similar"] ?? {}) as RawMovie;
    const genresRaw = Array.isArray(raw["genres"]) ? (raw["genres"] as RawMovie[]) : [];

    return {
      ...base,
      tagline: str(raw["tagline"]),
      runtimeMinutes: num(raw["runtime"]),
      status: str(raw["status"]),
      homepage: str(raw["homepage"]),
      genres: genresRaw
        .map((g) => ({ id: num(g["id"]), name: str(g["name"]) }))
        .filter((g): g is Genre => g.id !== null && g.name !== null),
      cast: castRaw.slice(0, 12).map((c) => ({
        id: num(c["id"]) ?? 0,
        name: str(c["name"]) ?? "Unknown",
        character: str(c["character"]) ?? "",
        profileUrl: img(c["profile_path"], "w185"),
      })),
      similar: normalisePage(similarRaw).items.slice(0, 12),
    };
  });
  return value;
}
