import { Link } from "@tanstack/react-router";
import { Heart, Star, Film } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MovieSummary } from "@/lib/tmdb-types";

type Props = {
  movie: MovieSummary;
  saved: boolean;
  pending?: boolean;
  onToggleSave: (movie: MovieSummary) => void;
};

export function MovieCard({ movie, saved, pending, onToggleSave }: Props) {
  return (
    <article className="group relative flex flex-col">
      <Link
        to="/movie/$movieId"
        params={{ movieId: String(movie.id) }}
        className="relative block overflow-hidden rounded-xl border border-border/60 bg-muted poster-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="aspect-[2/3] w-full">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={`Poster for ${movie.title}`}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 bg-secondary p-3 text-center">
              <Film className="size-8 text-muted-foreground" aria-hidden />
              <span className="line-clamp-3 text-xs text-muted-foreground">No poster available</span>
            </div>
          )}
        </div>

        {movie.rating !== null && movie.rating > 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-semibold text-foreground backdrop-blur">
            <Star className="size-3 fill-primary text-primary" aria-hidden />
            {movie.rating.toFixed(1)}
          </span>
        )}
      </Link>

      <button
        type="button"
        aria-label={saved ? `Remove ${movie.title} from wishlist` : `Add ${movie.title} to wishlist`}
        aria-pressed={saved}
        disabled={pending}
        onClick={() => onToggleSave(movie)}
        className={cn(
          "absolute right-2 top-2 grid size-9 place-items-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur transition hover:bg-background disabled:opacity-60",
          saved && "text-primary",
        )}
      >
        <Heart className={cn("size-4", saved && "fill-primary")} aria-hidden />
      </button>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-normal text-foreground">
          <Link to="/movie/$movieId" params={{ movieId: String(movie.id) }}>
            {movie.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">{movie.releaseYear ?? "Release date unknown"}</p>
      </div>
    </article>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-muted" />
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function MovieGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{children}</div>
  );
}
