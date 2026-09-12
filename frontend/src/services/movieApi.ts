import type { Genre, MovieDetail, MoviePage } from "../types/index";
import { request } from "./api";

export interface BrowseMoviesParams {
  [key: string]: string | number | undefined;
  page?: number;
  genre?: number;
  sort?: string;
  minRating?: number;
  year?: number;
}

export interface SearchMoviesParams {
  [key: string]: string | number | undefined;
  q: string;
  page?: number;
  sort?: string;
}

export async function fetchMovies(params: BrowseMoviesParams = {}): Promise<MoviePage> {
  return request<MoviePage>("/movies", { params });
}

export async function searchMovies(params: SearchMoviesParams): Promise<MoviePage> {
  return request<MoviePage>("/movies/search", { params });
}

export async function fetchMovieDetail(movieId: number): Promise<MovieDetail> {
  return request<MovieDetail>(`/movies/${movieId}`);
}

export async function fetchGenres(): Promise<Genre[]> {
  return request<Genre[]>("/genres");
}
