# Cineframe

Cineframe is a full-stack movie discovery app. Browse and search TMDB movies,
open detail pages, authenticate with Supabase, and save movies to a personal
wishlist.

## Stack

- **Frontend:** React 19, Vite, TypeScript, React Router, TanStack Query,
  Tailwind CSS v4, shadcn/ui, and Supabase Auth
- **Backend:** Node.js, Express, TypeScript, Zod, Helmet, CORS, and rate limiting
- **Data:** TMDB for movie data and Supabase for authentication, wishlist data,
  and caching

## Project Structure

```text
frontend/   React/Vite client
backend/    Express REST API
```

The browser calls the backend API. The backend keeps the TMDB credential
server-side and provides the normalized movie and wishlist API.

## Requirements

- Node.js 20 or newer
- npm
- A TMDB API key
- A Supabase project with the required wishlist tables and authentication

## Configuration

Create `backend/.env`:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5174

TMDB_API_KEY=your_tmdb_api_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Do not commit real API keys or Supabase secrets. The frontend only needs the
publishable Supabase key; keep the service role key in the backend environment.

## Run Locally

Install dependencies in both packages:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open the app at [http://localhost:5174](http://localhost:5174).

The backend runs at [http://localhost:3000](http://localhost:3000). Verify it
is available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Frontend Commands

Run these from `frontend/`:

```bash
npm run dev        # Start Vite in development mode
npm run typecheck  # Run TypeScript checks
npm run build      # Typecheck and create a production build
npm run preview    # Preview the production build
```

## Backend Commands

Run these from `backend/`:

```bash
npm run dev        # Start the API with tsx watch mode
npm run typecheck  # Run TypeScript checks
npm run build      # Compile to dist/
npm start          # Run the compiled API
```

## API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | API health status |
| `GET` | `/api/movies` | No | Browse movies with filters and pagination |
| `GET` | `/api/movies/search` | No | Search movies |
| `GET` | `/api/movies/:movieId` | No | Movie details, cast, and similar movies |
| `GET` | `/api/genres` | No | Available movie genres |
| `GET` | `/api/wishlist` | Yes | Get the signed-in user's wishlist |
| `POST` | `/api/wishlist` | Yes | Add a movie to the wishlist |
| `DELETE` | `/api/wishlist/:movieId` | Yes | Remove a movie from the wishlist |

Protected endpoints require an `Authorization: Bearer <supabase_access_token>`
header.

## Features

- URL-persistent browse filters, sorting, and search state
- Debounced movie search
- Infinite scrolling with a manual load-more fallback
- Loading, empty, error, retry, and degraded-data states
- Supabase email authentication
- Per-user wishlist persistence
- TMDB response normalization, caching, retries, timeouts, and stale-cache
  fallback

## Known Limitations

- Search sorting is applied within each fetched TMDB page.
- Genre filtering currently supports one genre at a time.
- Automated tests are not yet included.
