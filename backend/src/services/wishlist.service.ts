import type { SupabaseClient } from "@supabase/supabase-js";
import type { MovieSummary, WishlistEntry } from "../types/index.js";

export async function listWishlist(
  supabase: SupabaseClient,
  userId: string,
): Promise<WishlistEntry[]> {
  const { data, error } = await supabase
    .from("wishlist")
    .select(
      "movie_id, title, poster_path, release_date, vote_average, overview, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.movie_id,
    title: row.title,
    overview: row.overview ?? "",
    posterUrl: row.poster_path,
    backdropUrl: null,
    releaseDate: row.release_date,
    releaseYear: row.release_date
      ? Number(row.release_date.slice(0, 4)) || null
      : null,
    rating: row.vote_average === null ? null : Number(row.vote_average),
    voteCount: 0,
    genreIds: [],
    addedAt: row.created_at,
  }));
}

export async function addToWishlist(
  supabase: SupabaseClient,
  userId: string,
  movie: Partial<MovieSummary> & {
    id: number;
    title: string;
  },
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from("wishlist")
    .upsert(
      {
        user_id: userId,
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.posterUrl ?? null,
        release_date: movie.releaseDate ?? null,
        vote_average: movie.rating ?? null,
        overview: movie.overview ?? null,
      },
      {
        onConflict: "user_id,movie_id",
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

export async function removeFromWishlist(
  supabase: SupabaseClient,
  movieId: number,
  userId: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("movie_id", movieId);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}