// RPC surface the client uses. The client never calls TMDB directly.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Genre, MovieDetail, MoviePage } from "./tmdb-types";

const browseSchema = z.object({
  query: z.string().max(120).optional(),
  genreId: z.number().int().positive().optional(),
  sort: z.string().max(40).optional(),
  minRating: z.number().min(0).max(10).optional(),
  year: z.number().int().min(1874).max(2100).optional(),
  page: z.number().int().min(1).max(500).optional(),
});

export type BrowseInput = z.infer<typeof browseSchema>;

export type BrowseResult =
  | { ok: true; data: MoviePage }
  | { ok: false; reason: "config" | "unavailable"; message: string };

export const browseMoviesFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => browseSchema.parse(input))
  .handler(async ({ data }): Promise<BrowseResult> => {
    const mod = await import("./tmdb.server");
    try {
      return { ok: true, data: await mod.browseMovies(data) };
    } catch (error) {
      return failure(error, mod);
    }
  });

export const getGenresFn = createServerFn({ method: "GET" }).handler(async (): Promise<Genre[]> => {
  const mod = await import("./tmdb.server");
  try {
    return await mod.getGenres();
  } catch {
    return [];
  }
});

export const getMovieFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; data: MovieDetail | null } | { ok: false; reason: "config" | "unavailable"; message: string }
    > => {
      const mod = await import("./tmdb.server");
      try {
        return { ok: true, data: await mod.getMovieDetail(data.id) };
      } catch (error) {
        return failure(error, mod);
      }
    },
  );

function failure(error: unknown, mod: typeof import("./tmdb.server")) {
  console.error("[tmdb]", error);
  if (error instanceof mod.TmdbConfigError) {
    return {
      ok: false as const,
      reason: "config" as const,
      message: "The movie service is not configured yet.",
    };
  }
  return {
    ok: false as const,
    reason: "unavailable" as const,
    message: "The movie service is temporarily unavailable. Please try again.",
  };
}
