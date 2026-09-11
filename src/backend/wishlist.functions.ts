import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import type { MovieSummary } from "@/shared/tmdb-types";

const movieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(300),
  posterUrl: z.string().url().nullable().optional(),
  releaseDate: z.string().max(20).nullable().optional(),
  rating: z.number().nullable().optional(),
  overview: z.string().max(4000).optional(),
});

export type WishlistEntry = MovieSummary & { addedAt: string };

export const listWishlistFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WishlistEntry[]> => {
    const { data, error } = await context.supabase
      .from("wishlist_items")
      .select("movie_id, title, poster_path, release_date, vote_average, overview, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
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
  });

export const addToWishlistFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => movieSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("wishlist_items").upsert(
      {
        user_id: context.userId,
        movie_id: data.id,
        title: data.title,
        poster_path: data.posterUrl ?? null,
        release_date: data.releaseDate ?? null,
        vote_average: data.rating ?? null,
        overview: data.overview ?? null,
      },
      { onConflict: "user_id,movie_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromWishlistFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("wishlist_items").delete().eq("movie_id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
