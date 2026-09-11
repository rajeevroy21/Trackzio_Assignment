# Cineframe — Movie Discovery App

A full-stack movie discovery product: browse, search, filter, sort and paginate
thousands of films, open rich detail pages, and keep a persistent wishlist tied
to your account.

## Tech stack

- **Frontend**: React 19, TanStack Start (SSR) + TanStack Router + TanStack
  Query, Tailwind CSS v4, shadcn/ui
- **Backend**: TanStack Start server functions (`createServerFn`) — a typed RPC
  layer running on edge workers, acting as the abstraction between the client
  and the external movie API
- **Database & auth**: Lovable Cloud (PostgreSQL + managed auth: email/password
  and Google)
- **External data**: TMDB (The Movie Database) API

## Setup

1. `bun install` (or `npm install`)
2. Add a TMDB API credential (`TMDB_API_KEY`) to the project's secrets —
   get one free at themoviedb.org → Settings → API. Both v3 API keys and v4
   read-access tokens are supported.
3. `bun run dev`

The wishlist and cache tables are created by the migration in
`drizzle/migrations/0000_create_wishlist_and_tmdb_cache.sql`.

## Approach & key decisions

### The backend as an abstraction layer
The browser **never** calls TMDB. All upstream access lives in
`src/lib/tmdb.server.ts`; the client talks to typed server functions in
`src/lib/tmdb.functions.ts`. This keeps the API key server-side and lets the
app own its data shape:

- **Normalisation**: TMDB payloads are messy and incomplete (missing posters,
  titles in `name` vs `title`, null runtimes). Every record is normalised into
  a `MovieSummary`/`MovieDetail` (`src/lib/tmdb-types.ts`); unusable records
  are dropped. Image URLs are resolved server-side.
- **Caching**: responses are cached in the `tmdb_cache` Postgres table with
  TTLs (30 min for browsing, 5 min for search, 24 h for genres, 6 h for
  details). Repeated requests are near-free and TMDB's rate limits are
  respected.
- **Resilience**: every upstream call has an 8 s timeout, a 3-attempt backoff
  (honouring `Retry-After` on 429s), and a **stale-cache fallback** — if TMDB
  is slow or down but we have an expired cache entry, we serve it with a
  "recently saved results" banner instead of failing.
- **Search sorting**: TMDB's `/search/movie` cannot sort server-side, so sort
  order is applied after normalisation for search results.

### Frontend
- Browsing state (query, genre, rating, sort) lives in **URL search params**,
  so sharing a link and navigating to a detail page and back preserves context.
- Search input is **debounced** (450 ms) to avoid a request per keystroke.
- **Infinite scroll** via TanStack Query's `useInfiniteQuery` plus an
  IntersectionObserver sentinel, with a manual "Load more" fallback. Duplicate
  entries across pages are de-duplicated.
- Query-level caching (`staleTime`) avoids re-fetching on navigation.
- Loading skeletons, empty states, error states with retry, and a
  degraded-data banner cover the feedback spectrum.
- Posters use `aspect-[2/3]` + `object-cover` + a placeholder so varying
  poster dimensions never break the grid; long titles clamp to two lines.

### Persistence
- Wishlist rows are stored per user in `wishlist_items` with row-level
  security — users can only ever read or write their own rows.
- Adding a movie stores a denormalised snapshot (title, poster, date, rating)
  so the wishlist page renders instantly without extra TMDB calls; the row's
  `movie_id` links to the live detail page.
- The wishlist route sits under a `_authenticated` layout that redirects to
  `/auth` when signed out. Server functions re-validate the bearer token, so
  the route guard is UX, the function middleware is security.

## Assumptions

- TMDB's 500-page cap on result sets is fine for discovery.
- Poster/rating snapshots in the wishlist can be slightly stale — the detail
  page always shows live data.
- English (`en-US`) catalogue data.

## Known limitations

- Search result sorting applies only within each fetched page (TMDB returns
  popularity-ordered search results).
- Genre filter is a single choice (TMDB supports comma lists; UI kept simple).
- No automated tests yet.

## AI usage

Built with Lovable (AI-assisted development): initial boilerplate, component
scaffolding and API integration were AI-generated; the architecture (cache +
stale fallback, normalisation boundary, URL-driven state, RLS data model) was
designed and reviewed deliberately. All code is understood and owned by the
author.

## With more time

- Server-side wishlist sync indicator + realtime updates across tabs.
- Multi-select genres and year-range sliders.
- Personalised "because you saved X" recommendations.
- Unit tests for the normalisation layer and e2e tests for browse/save flows.
- Cache cleanup job for expired `tmdb_cache` rows.
