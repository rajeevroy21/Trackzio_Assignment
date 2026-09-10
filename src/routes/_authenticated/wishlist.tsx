import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, HeartOff } from "lucide-react";

import { MovieCard, MovieCardSkeleton, MovieGrid } from "@/components/MovieCard";
import { StateMessage } from "@/components/StateMessage";
import { useWishlist } from "@/hooks/useWishlist";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Your wishlist — Cineframe" },
      { name: "description", content: "Every movie you've saved on Cineframe, kept safe on your account." },
      { property: "og:title", content: "Your wishlist — Cineframe" },
      { property: "og:description", content: "Every movie you've saved, kept safe on your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const wishlist = useWishlist();
  const navigate = useNavigate();

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
            action={{ label: "Start browsing", onClick: () => void navigate({ to: "/" }) }}
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
