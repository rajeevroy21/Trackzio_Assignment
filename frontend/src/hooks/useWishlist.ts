import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addToWishlist, fetchWishlist, removeFromWishlist } from "../services/wishlistApi";
import type { MovieSummary, WishlistEntry } from "../types/index";
import { getFreshToken, useAuth } from "./useAuth";

export const wishlistQueryKey = ["wishlist"] as const;

export function useWishlist() {
  const { signedIn, token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<WishlistEntry[]>({
    queryKey: wishlistQueryKey,
    queryFn: async () => {
      const activeToken = (await getFreshToken()) || token;
      if (!activeToken) throw new Error("No authentication token");
      return fetchWishlist(activeToken);
    },
    enabled: signedIn && Boolean(token),
    staleTime: 30_000,
  });

  const items = query.data ?? [];
  const ids = new Set(items.map((item) => item.id));

  const toggle = useMutation({
    mutationFn: async (movie: MovieSummary) => {
      const activeToken = (await getFreshToken()) || token;
      if (!activeToken) throw new Error("Please sign in to update your wishlist.");
      if (ids.has(movie.id)) {
        await removeFromWishlist(movie.id, activeToken);
        return { removed: true, movie };
      }
      await addToWishlist(movie, activeToken);
      return { removed: false, movie };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wishlistQueryKey });
      toast.success(result.removed ? `Removed ${result.movie.title}` : `Saved ${result.movie.title}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't update your wishlist. Please try again.");
    },
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
