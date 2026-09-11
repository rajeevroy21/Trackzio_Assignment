import type { Genre, MovieDetail, MoviePage, MovieSummary } from "../types/index.js";
import { cached } from "./cache.service.js";
import { img, num, str, tmdbFetch, type RawMovie } from "./tmdb.service.js";

export function normaliseMovie(raw: RawMovie): MovieSummary | null {
  const id = num(raw["id"]);
  const title = str(raw["title"]) ?? str(raw["original_title"]) ?? str(raw["name"]);
  if (id === null || !title) return null;
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

export function normalisePage(raw: RawMovie | null): MoviePage {
  const results = Array.isArray(raw?.["results"]) ? (raw["results"] as RawMovie[]) : [];
  return {
    items: results.map(normaliseMovie).filter((m): m is MovieSummary => m !== null),
    page: num(raw?.["page"]) ?? 1,
    totalPages: Math.min(num(raw?.["total_pages"]) ?? 1, 500),
    totalResults: num(raw?.["total_results"]) ?? 0,
  };
}

export type BrowseParams = {
  query?: string | undefined;
  genreId?: number | undefined;
  sort?: string | undefined;
  minRating?: number | undefined;
  year?: number | undefined;
  page?: number | undefined;
};

export async function browseMovies(params: BrowseParams): Promise<MoviePage> {
  const page = Math.min(Math.max(params.page ?? 1, 1), 500);
  const query = params.query?.trim() ?? "";
  const key = `browse:${JSON.stringify({ ...params, page, query })}`;
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
