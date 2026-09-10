import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { addToWishlistFn, listWishlistFn, removeFromWishlistFn } from "@/lib/wishlist.functions";
import type { WishlistEntry } from "@/lib/wishlist.functions";
import type { MovieSummary } from "@/lib/tmdb-types";
import { useAuth } from "./useAuth";

export const wishlistQueryKey = ["wishlist"] as const;

export function useWishlist() {
  const { signedIn } = useAuth();
  const listFn = useServerFn(listWishlistFn);
  const addFn = useServerFn(addToWishlistFn);
  const removeFn = useServerFn(removeFromWishlistFn);
  const queryClient = useQueryClient();

  const query = useQuery<WishlistEntry[]>({
    queryKey: wishlistQueryKey,
    queryFn: () => listFn(),
    enabled: signedIn,
    staleTime: 30_000,
  });

  const items = query.data ?? [];
  const ids = new Set(items.map((item) => item.id));

  const toggle = useMutation({
    mutationFn: async (movie: MovieSummary) => {
      if (ids.has(movie.id)) {
        await removeFn({ data: { id: movie.id } });
        return { removed: true, movie };
      }
      await addFn({
        data: {
          id: movie.id,
          title: movie.title,
          posterUrl: movie.posterUrl,
          releaseDate: movie.releaseDate,
          rating: movie.rating,
          overview: movie.overview.slice(0, 4000),
        },
      });
      return { removed: false, movie };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wishlistQueryKey });
      toast.success(result.removed ? `Removed ${result.movie.title}` : `Saved ${result.movie.title}`);
    },
    onError: () => toast.error("Couldn't update your wishlist. Please try again."),
  });

  return {
    items,
    ids,
    isLoading: query.isLoading && signedIn,
    isError: query.isError,
    signedIn,
    toggle: toggle.mutate,
    pendingId: toggle.isPending ? toggle.variables?.id : undefined,
  };
}
