export interface MovieSummary {
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
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetail extends MovieSummary {
  tagline: string | null;
  runtimeMinutes: number | null;
  genres: Genre[];
  status: string | null;
  homepage: string | null;
  cast: { id: number; name: string; character: string; profileUrl: string | null }[];
  similar: MovieSummary[];
}

export interface MoviePage {
  items: MovieSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
  stale?: boolean;
}

export interface WishlistEntry extends MovieSummary {
  addedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export type SortValue =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "primary_release_date.asc"
  | "title.asc";

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "popularity.desc", label: "Most popular" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest first" },
  { value: "primary_release_date.asc", label: "Oldest first" },
  { value: "title.asc", label: "Title (A-Z)" },
];

export function isSortValue(value: string): value is SortValue {
  return SORT_OPTIONS.some((opt) => opt.value === value);
}
