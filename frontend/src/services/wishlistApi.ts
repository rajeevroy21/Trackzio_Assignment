import type { MovieSummary, WishlistEntry } from "../types/index";
import { request } from "./api";

export async function fetchWishlist(token: string): Promise<WishlistEntry[]> {
  return request<WishlistEntry[]>("/wishlist", { token });
}

export async function addToWishlist(movie: MovieSummary, token: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/wishlist", {
    method: "POST",
    token,
    body: JSON.stringify({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      releaseDate: movie.releaseDate,
      rating: movie.rating,
      overview: movie.overview?.slice(0, 4000) ?? "",
    }),
  });
}

export async function removeFromWishlist(movieId: number, token: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/wishlist/${movieId}`, {
    method: "DELETE",
    token,
  });
}
