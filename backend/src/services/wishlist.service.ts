import type { SupabaseClient } from "@supabase/supabase-js";
import type { MovieSummary, WishlistEntry } from "../types/index.js";

// In-memory fallback store for when Supabase table 'wishlist_items' is missing or not migrated yet
const memoryWishlists = new Map<string, Map<number, WishlistEntry>>();

function getMemoryStore(userId: string): Map<number, WishlistEntry> {
  if (!memoryWishlists.has(userId)) {
    memoryWishlists.set(userId, new Map());
  }
  return memoryWishlists.get(userId)!;
}

export async function listWishlist(supabase: SupabaseClient, userId?: string): Promise<WishlistEntry[]> {
  try {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("movie_id, title, poster_path, release_date, vote_average, overview, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205" || error.code === "42P01") {
        const store = getMemoryStore(userId || "default");
        return Array.from(store.values()).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      }
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.movie_id,
      title: row.title,
      overview: row.overview ?? "",
      posterUrl: row.poster_path,
      backdropUrl: null,
      releaseDate: row.release_date,
      releaseYear: row.release_date ? Number(row.release_date.slice(0, 4)) || null : null,
      rating: row.vote_average === null ? null : Number(row.vote_average),
      voteCount: 0,
      genreIds: [],
      addedAt: row.created_at,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Could not find the table") || msg.includes("PGRST205") || msg.includes("42P01")) {
      const store = getMemoryStore(userId || "default");
      return Array.from(store.values()).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
    throw err;
  }
}

export async function addToWishlist(
  supabase: SupabaseClient,
  userId: string,
  movie: Partial<MovieSummary> & { id: number; title: string },
): Promise<{ ok: boolean }> {
  try {
    const { error } = await supabase.from("wishlist_items").upsert(
      {
        user_id: userId,
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.posterUrl ?? null,
        release_date: movie.releaseDate ?? null,
        vote_average: movie.rating ?? null,
        overview: movie.overview ?? null,
      },
      { onConflict: "user_id,movie_id" },
    );

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205" || error.code === "42P01") {
        const store = getMemoryStore(userId);
        store.set(movie.id, {
          id: movie.id,
          title: movie.title,
          overview: movie.overview ?? "",
          posterUrl: movie.posterUrl ?? null,
          backdropUrl: null,
          releaseDate: movie.releaseDate ?? null,
          releaseYear: movie.releaseYear ?? null,
          rating: movie.rating ?? null,
          voteCount: 0,
          genreIds: movie.genreIds ?? [],
          addedAt: new Date().toISOString(),
        });
        return { ok: true };
      }
      throw new Error(error.message);
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Could not find the table") || msg.includes("PGRST205") || msg.includes("42P01")) {
      const store = getMemoryStore(userId);
      store.set(movie.id, {
        id: movie.id,
        title: movie.title,
        overview: movie.overview ?? "",
        posterUrl: movie.posterUrl ?? null,
        backdropUrl: null,
        releaseDate: movie.releaseDate ?? null,
        releaseYear: movie.releaseYear ?? null,
        rating: movie.rating ?? null,
        voteCount: 0,
        genreIds: movie.genreIds ?? [],
        addedAt: new Date().toISOString(),
      });
      return { ok: true };
    }
    throw err;
  }
}

export async function removeFromWishlist(
  supabase: SupabaseClient,
  movieId: number,
  userId?: string,
): Promise<{ ok: boolean }> {
  try {
    const { error } = await supabase.from("wishlist_items").delete().eq("movie_id", movieId);
    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205" || error.code === "42P01") {
        const store = getMemoryStore(userId || "default");
        store.delete(movieId);
        return { ok: true };
      }
      throw new Error(error.message);
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Could not find the table") || msg.includes("PGRST205") || msg.includes("42P01")) {
      const store = getMemoryStore(userId || "default");
      store.delete(movieId);
      return { ok: true };
    }
    throw err;
  }
}
