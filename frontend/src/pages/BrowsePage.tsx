import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import { fetchGenres, fetchMovies, searchMovies } from "@/services/movieApi";
import { isSortValue, SORT_OPTIONS, type SortValue } from "@/types/index";

const RATING_FILTERS = [
  { value: "0", label: "Any rating" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
];

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const wishlist = useWishlist();

  const q = searchParams.get("q") || undefined;
  const genre = searchParams.get("genre") ? Number(searchParams.get("genre")) : undefined;
  const sortRaw = searchParams.get("sort") || "";
  const sort: SortValue = isSortValue(sortRaw) ? sortRaw : "popularity.desc";
  const min = searchParams.get("min") ? Number(searchParams.get("min")) : undefined;

  const [term, setTerm] = useState(q ?? "");
  const debouncedTerm = useDebouncedValue(term, 450);

  useEffect(() => {
    const next = debouncedTerm.trim();
    if ((q ?? "") === next) return;
    setSearchParams(
      (prev) => {
        if (next) prev.set("q", next);
        else prev.delete("q");
        return prev;
      },
      { replace: true },
    );
  }, [debouncedTerm, q, setSearchParams]);

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
    staleTime: 1000 * 60 * 60,
  });

  const query = useInfiniteQuery({
    queryKey: ["movies", q ?? "", genre ?? 0, sort, min ?? 0],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (q) {
        return searchMovies({ q, page: pageParam, sort });
      }
      return fetchMovies({
        page: pageParam,
        genre,
        sort,
        minRating: min,
      });
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const pages = query.data?.pages ?? [];
  const movies = useMemo(() => {
    const seen = new Set<number>();
    return pages
      .flatMap((page) => page.items)
      .filter((movie) => (seen.has(movie.id) ? false : seen.add(movie.id)));
  }, [pages]);

  const first = pages[0];
  const total = first?.totalResults ?? 0;
  const stale = pages.some((page) => page.stale);

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
  }, [query]);

  const updateSearchParam = (key: string, value: string | number | undefined) => {
    setSearchParams(
      (prev) => {
        if (value !== undefined && value !== 0 && value !== "0") {
          prev.set(key, String(value));
        } else {
          prev.delete(key);
        }
        return prev;
      },
      { replace: true },
    );
  };

  const activeGenre = genres.find((g) => g.id === genre);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6">
      <section className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Now exploring</p>
        <h1 className="mt-2 text-4xl leading-none text-foreground sm:text-6xl">
          {q
            ? `Results for “${q}”`
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
              value={genre ? String(genre) : "0"}
              onValueChange={(val) => updateSearchParam("genre", val === "0" ? undefined : val)}
            >
              <SelectTrigger className="h-11 w-[9.5rem]" aria-label="Filter by genre">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All genres</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(min ?? 0)}
              onValueChange={(val) => updateSearchParam("min", val === "0" ? undefined : val)}
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

            <Select
              value={sort}
              onValueChange={(val) => isSortValue(val) && updateSearchParam("sort", val)}
            >
              <SelectTrigger className="h-11 w-[11rem]" aria-label="Sort results">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(q || genre || min || sort !== "popularity.desc") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTerm("");
                  setSearchParams({}, { replace: true });
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {stale && (
        <aside
          role="status"
          className="mb-6 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs text-primary-foreground"
        >
          <AlertTriangle className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Showing cached movie results while updating fresh data from TMDB.</span>
        </aside>
      )}

      {query.isPending ? (
        <MovieGrid>
          {Array.from({ length: 12 }).map((_, idx) => (
            <MovieCardSkeleton key={idx} />
          ))}
        </MovieGrid>
      ) : query.isError ? (
        <StateMessage
          icon={<AlertTriangle className="size-10 text-destructive" aria-hidden />}
          title="Couldn't load movies"
          description={query.error instanceof Error ? query.error.message : "Something went wrong while fetching movies."}
          action={{ label: "Try again", onClick: () => void query.refetch() }}
        />
      ) : movies.length === 0 ? (
        <StateMessage
          icon={<SearchX className="size-10 text-muted-foreground" aria-hidden />}
          title="No movies found"
          description="Try broadening your search term or resetting your genre and rating filters."
          action={{
            label: "Clear filters",
            onClick: () => {
              setTerm("");
              setSearchParams({}, { replace: true });
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

          <div ref={sentinel} className="mt-12 flex items-center justify-center py-6">
            {query.isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
                Loading more films…
              </span>
            ) : query.hasNextPage ? (
              <Button variant="outline" onClick={() => void query.fetchNextPage()}>
                Load more
              </Button>
            ) : movies.length > 0 ? (
              <span className="text-xs text-muted-foreground">You've reached the end of the list</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
