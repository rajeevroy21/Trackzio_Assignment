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

export interface AuthenticatedUser {
  id: string;
  email?: string;
}
