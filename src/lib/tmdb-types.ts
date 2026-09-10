// Client-safe shared types + helpers for the app's own movie representation.
// The client never sees raw TMDB payloads — the backend normalises them first.

export type MovieSummary = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  releaseDate: string | null;
  rating: number | null;
  voteCount: number;
  genreIds: number[];
};

export type MovieDetail = MovieSummary & {
  tagline: string | null;
  runtimeMinutes: number | null;
  genres: { id: number; name: string }[];
  status: string | null;
  homepage: string | null;
  cast: { id: number; name: string; character: string; profileUrl: string | null }[];
  similar: MovieSummary[];
};

export type MoviePage = {
  items: MovieSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
  /** true when the payload came from a degraded/stale source */
  stale?: boolean;
};

export type Genre = { id: number; name: string };

export const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest first" },
  { value: "primary_release_date.asc", label: "Oldest first" },
  { value: "revenue.desc", label: "Biggest box office" },
  { value: "title.asc", label: "Title (A–Z)" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(value: string): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}
