import { AlertTriangle, HeartOff, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { MovieCard, MovieCardSkeleton, MovieGrid } from "@/components/MovieCard";
import { StateMessage } from "@/components/StateMessage";
import { useWishlist } from "@/hooks/useWishlist";

export function WishlistPage() {
  const wishlist = useWishlist();
  const navigate = useNavigate();

  if (!wishlist.signedIn) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-16 sm:px-6">
        <StateMessage
          icon={<UserIcon className="size-10 text-primary" aria-hidden />}
          title="Sign in required"
          description="Please sign in to view and manage your saved movie wishlist."
          action={{ label: "Sign in", onClick: () => navigate("/auth") }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">Saved for later</p>
      <h1 className="mt-2 text-4xl leading-none text-foreground sm:text-6xl">Your wishlist</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {wishlist.items.length > 0
          ? `${wishlist.items.length} ${wishlist.items.length === 1 ? "film" : "films"} waiting for you.`
          : "Films you save while browsing show up here."}
      </p>

      <div className="mt-8">
        {wishlist.isLoading ? (
          <MovieGrid>
            {Array.from({ length: 5 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))}
          </MovieGrid>
        ) : wishlist.isError ? (
          <StateMessage
            icon={<AlertTriangle className="size-8 text-primary" aria-hidden />}
            title="Couldn't load your wishlist"
            description="Please check your connection and try again."
            action={{ label: "Reload", onClick: () => window.location.reload() }}
          />
        ) : wishlist.items.length === 0 ? (
          <StateMessage
            icon={<HeartOff className="size-8 text-primary" aria-hidden />}
            title="Nothing saved yet"
            description="Tap the heart on any poster to keep it here."
            action={{ label: "Start browsing", onClick: () => navigate("/") }}
          />
        ) : (
          <MovieGrid>
            {wishlist.items.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                saved
                pending={wishlist.pendingId === movie.id}
                onToggleSave={wishlist.toggle}
              />
            ))}
          </MovieGrid>
        )}
      </div>
    </div>
  );
}
