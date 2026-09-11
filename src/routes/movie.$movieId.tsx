import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Heart, Star } from "lucide-react";

import { MovieCard, MovieGrid } from "@/frontend/components/MovieCard";
import { StateMessage } from "@/frontend/components/StateMessage";
import { Button } from "@/frontend/components/ui/button";
import { useWishlist } from "@/frontend/hooks/useWishlist";
import { getMovieFn } from "@/backend/tmdb.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/movie/$movieId")({
  head: () => ({
    meta: [
      { title: "Movie details — Cineframe" },
      { name: "description", content: "Cast, runtime, rating and similar films for this movie on Cineframe." },
      { property: "og:title", content: "Movie details — Cineframe" },
      { property: "og:description", content: "Cast, runtime, rating and similar films on Cineframe." },
      { property: "og:type", content: "video.movie" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoviePage,
});

function MoviePage() {
  const { movieId } = Route.useParams();
  const router = useRouter();
  const getMovie = useServerFn(getMovieFn);
  const wishlist = useWishlist();
  const id = Number(movieId);

  const query = useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovie({ data: { id } }),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 1000 * 60 * 30,
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[280px_1fr]">
        <div className="aspect-[2/3] animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-4">
          <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const result = query.data;

  if (!result || !result.ok) {
    return (
      <div className="px-4 py-16">
        <StateMessage
          icon={<AlertTriangle className="size-8 text-primary" aria-hidden />}
          title="Couldn't load this movie"
          description={result && !result.ok ? result.message : "Please try again in a moment."}
          action={{ label: "Try again", onClick: () => void query.refetch() }}
        />
      </div>
    );
  }

  const movie = result.data;
  if (!movie) {
    return (
      <div className="px-4 py-16">
        <StateMessage
          title="Movie not found"
          description="This title isn't in the catalogue any more."
          action={{ label: "Back to browsing", onClick: () => void router.navigate({ to: "/" }) }}
        />
      </div>
    );
  }

  const saved = wishlist.ids.has(movie.id);

  return (
    <div>
      <div className="relative">
        {movie.backdropUrl && (
          <div className="absolute inset-0 -z-10 h-[420px] overflow-hidden">
            <img src={movie.backdropUrl} alt="" aria-hidden className="size-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="mb-6">
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Button>

          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            <div className="mx-auto w-full max-w-[280px]">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={`Poster for ${movie.title}`}
                  className="aspect-[2/3] w-full rounded-2xl object-cover poster-shadow"
                />
              ) : (
                <div className="grid aspect-[2/3] w-full place-items-center rounded-2xl bg-secondary text-sm text-muted-foreground">
                  No poster
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-4xl leading-none text-foreground sm:text-6xl">{movie.title}</h1>
              {movie.tagline && <p className="mt-2 text-base italic text-muted-foreground">{movie.tagline}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {movie.rating !== null && movie.rating > 0 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Star className="size-4 fill-primary text-primary" aria-hidden />
                    {movie.rating.toFixed(1)}
                    <span className="font-normal text-muted-foreground">
                      ({movie.voteCount.toLocaleString()} votes)
                    </span>
                  </span>
                )}
                {movie.releaseYear && <span>{movie.releaseYear}</span>}
                {movie.runtimeMinutes ? (
                  <span>
                    {Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m
                  </span>
                ) : null}
                {movie.status && <span>{movie.status}</span>}
              </div>

              {movie.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      to="/"
                      search={{ genre: genre.id }}
                      className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition hover:border-primary hover:text-primary"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}

              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/90">
                {movie.overview || "No synopsis has been published for this film yet."}
              </p>

              <div className="mt-6">
                <Button
                  variant={saved ? "outline" : "default"}
                  disabled={wishlist.pendingId === movie.id}
                  onClick={() => wishlist.toggle(movie)}
                >
                  <Heart className={cn("size-4", saved && "fill-primary text-primary")} aria-hidden />
                  {saved ? "In your wishlist" : "Add to wishlist"}
                </Button>
                {!wishlist.signedIn && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <Link to="/auth" className="text-primary underline">
                      Sign in
                    </Link>{" "}
                    to keep your wishlist across devices.
                  </p>
                )}
              </div>
            </div>
          </div>

          {movie.cast.length > 0 && (
            <section className="mt-14">
              <h2 className="text-2xl text-foreground">Cast</h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
                {movie.cast.map((person) => (
                  <div key={`${person.id}-${person.character}`} className="w-28 shrink-0">
                    <div className="aspect-[2/3] overflow-hidden rounded-xl bg-secondary">
                      {person.profileUrl ? (
                        <img
                          src={person.profileUrl}
                          alt={person.name}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground">{person.name}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{person.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {movie.similar.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-4 text-2xl text-foreground">More like this</h2>
              <MovieGrid>
                {movie.similar.map((similar) => (
                  <MovieCard
                    key={similar.id}
                    movie={similar}
                    saved={wishlist.ids.has(similar.id)}
                    pending={wishlist.pendingId === similar.id}
                    onToggleSave={wishlist.toggle}
                  />
                ))}
              </MovieGrid>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
