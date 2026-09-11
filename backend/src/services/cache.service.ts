import { supabaseAdmin } from "../config/database.js";

type CacheRow = { payload: unknown; expires_at: string };

export async function readCache(key: string): Promise<{ payload: unknown; fresh: boolean } | null> {
  try {
    const { data } = await supabaseAdmin
      .from("tmdb_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle<CacheRow>();
    if (!data) return null;
    return { payload: data.payload, fresh: new Date(data.expires_at).getTime() > Date.now() };
  } catch {
    return null;
  }
}

export async function writeCache(key: string, payload: unknown, ttlSeconds: number) {
  try {
    await supabaseAdmin.from("tmdb_cache").upsert({
      cache_key: key,
      payload: payload as never,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
  } catch {
    // Caching is best-effort
  }
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<{ value: T; stale: boolean }> {
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
