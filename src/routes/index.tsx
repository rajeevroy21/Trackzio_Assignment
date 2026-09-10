import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Search, SearchX, SlidersHorizontal } from "lucide-react";

import { MovieCard, MovieCardSkeleton, MovieGrid } from "@/components/MovieCard";
import { StateMessage } from "@/components/StateMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useWishlist } from "@/hooks/useWishlist";
import { browseMoviesFn, getGenresFn } from "@/lib/tmdb.functions";
import { SORT_OPTIONS, isSortValue, type SortValue } from "@/lib/tmdb-types";

type Search = {
  q?: string;
  genre?: number;
  sort?: SortValue;
  min?: number;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const q = typeof search["q"] === "string" ? search["q"].slice(0, 120) : undefined;
    const genre = Number(search["genre"]);
    const min = Number(search["min"]);
    const sortRaw = typeof search["sort"] === "string" ? search["sort"] : "";
    return {
      ...(q ? { q } : {}),
      ...(Number.isFinite(genre) && genre > 0 ? { genre } : {}),
      ...(Number.isFinite(min) && min > 0 ? { min } : {}),
      ...(isSortValue(sortRaw) ? { sort: sortRaw } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Cineframe — Discover your next favourite film" },
      {
        name: "description",
        content:
          "Browse, search and filter thousands of movies by genre, rating and release date, then save the ones you love to your wishlist.",
      },
      { property: "og:title", content: "Cineframe — Discover your next favourite film" },
      {
        property: "og:description",
        content: "Browse, search and filter thousands of movies, then save your favourites to a wishlist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});

const RATING_FILTERS = [
  { value: "0", label: "Any rating" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
];

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const browse = useServerFn(browseMoviesFn);
  const genresFn = useServerFn(getGenresFn);
  const wishlist = useWishlist();

  const [term, setTerm] = useState(search.q ?? "");
  const debouncedTerm = useDebouncedValue(term, 450);

  // Keep the URL in sync with the debounced term so browsing state survives
  // navigation to a detail page and back.
  useEffect(() => {
    const next = debouncedTerm.trim();
    if ((search.q ?? "") === next) return;
    void navigate({
      search: (prev) => ({ ...prev, ...(next ? { q: next } : { q: undefined }) }),
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: () => genresFn(),
    staleTime: 1000 * 60 * 60,
  });

  const sort: SortValue = search.sort ?? "popularity.desc";

  const query = useInfiniteQuery({
    queryKey: ["movies", search.q ?? "", search.genre ?? 0, sort, search.min ?? 0],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      browse({
        data: {
          ...(search.q ? { query: search.q } : {}),
          ...(search.genre ? { genreId: search.genre } : {}),
          ...(search.min ? { minRating: search.min } : {}),
          sort,
          page: pageParam,
        },
      }),
    getNextPageParam: (last) =>
      last.ok && last.data.page < last.data.totalPages ? last.data.page + 1 : undefined,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const pages = query.data?.pages ?? [];
  const failure = pages.find((page) => !page.ok);
  const movies = useMemo(() => {
    const seen = new Set<number>();
    return pages
      .flatMap((page) => (page.ok ? page.data.items : []))
      .filter((movie) => (seen.has(movie.id) ? false : seen.add(movie.id)));
  }, [pages]);
  const first = pages[0];
  const total = first?.ok ? first.data.totalResults : 0;
  const stale = pages.some((page) => page.ok && page.data.stale);

  // Infinite scroll sentinel.
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query]);

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const activeGenre = genres.find((genre) => genre.id === search.genre);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6">
      <section className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Now exploring</p>
        <h1 className="mt-2 text-4xl leading-none text-foreground sm:text-6xl">
          {search.q
            ? `Results for “${search.q}”`
            : activeGenre
              ? `${activeGenre.name} movies`
              : "Tonight's picks"}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          {total > 0
            ? `${total.toLocaleString()} films match what you're looking for.`
            : "Search a title, pick a genre, or just scroll — there's always something worth watching."}
        </p>
      </section>

      <section className="surface-panel sticky top-16 z-30 mb-8 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search movies by title…"
              aria-label="Search movies"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
            <Select
              value={search.genre ? String(search.genre) : "0"}
              onValueChange={(value) => setSearch({ genre: value === "0" ? undefined : Number(value) })}
            >
              <SelectTrigger className="h-11 w-[9.5rem]" aria-label="Filter by genre">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={String(genre.id)}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(search.min ?? 0)}
              onValueChange={(value) => setSearch({ min: value === "0" ? undefined : Number(value) })}
            >
              <SelectTrigger className="h-11 w-[7.5rem]" aria-label="Filter by rating">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                {RATING_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => isSortValue(value) && setSearch({ sort: value })}>
              <SelectTrigger className="h-11 w-[11rem]" aria-label="Sort results">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {stale && (
        <p className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="size-4 text-primary" aria-hidden />
          Showing recently saved results — the movie service is slow right now.
        </p>
      )}

      {query.isLoading ? (
        <MovieGrid>
          {Array.from({ length: 10 }).map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </MovieGrid>
      ) : failure ? (
        <StateMessage
          icon={<AlertTriangle className="size-8 text-primary" aria-hidden />}
          title={failure.ok ? "" : failure.reason === "config" ? "Almost ready" : "Something went wrong"}
          description={failure.ok ? "" : failure.message}
          action={{ label: "Try again", onClick: () => void query.refetch() }}
        />
      ) : movies.length === 0 ? (
        <StateMessage
          icon={<SearchX className="size-8 text-primary" aria-hidden />}
          title="No movies found"
          description="Try a different title, or loosen the genre and rating filters."
          action={{
            label: "Clear filters",
            onClick: () => {
              setTerm("");
              void navigate({ search: {} });
            },
          }}
        />
      ) : (
        <>
          <MovieGrid>
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                saved={wishlist.ids.has(movie.id)}
                pending={wishlist.pendingId === movie.id}
                onToggleSave={wishlist.toggle}
              />
            ))}
          </MovieGrid>

          <div ref={sentinel} className="h-12" />

          <div className="flex justify-center py-6">
            {query.isFetchingNextPage ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Loading more films…
              </span>
            ) : query.hasNextPage ? (
              <Button variant="outline" onClick={() => void query.fetchNextPage()}>
                Load more
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">You've reached the end of the reel.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
