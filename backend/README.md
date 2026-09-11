# Cineframe Backend REST API

Standalone Node.js + Express + TypeScript REST API server for Cineframe.

## Architecture

```text
React Frontend  -->  Node.js REST API  -->  TMDB API
                           │
                           ▼
                   PostgreSQL / Supabase
```

## Features
- **TMDB Service**: Handles movie browsing, search, details, genres, retries, backoff, timeout, and normalization.
- **Postgres Caching**: Caches TMDB responses in `tmdb_cache` with stale-data fallback.
- **Supabase Auth**: Middleware verifies `Authorization: Bearer <jwt_token>` for protected wishlist endpoints.
- **Security & Reliability**: `helmet`, `cors` origin controls, `express-rate-limit`, and centralized JSON error handling.

## Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Server health status |
| `GET` | `/api/movies` | No | Browse movies (`page`, `genre`, `sort`, `minRating`, `year`) |
| `GET` | `/api/movies/search` | No | Search movies (`q`, `page`, `sort`) |
| `GET` | `/api/movies/:movieId` | No | Movie detail with cast & similar films |
| `GET` | `/api/genres` | No | List movie genres |
| `GET` | `/api/wishlist` | **Yes** | Get user's saved wishlist |
| `POST` | `/api/wishlist` | **Yes** | Save movie to user's wishlist |
| `DELETE` | `/api/wishlist/:movieId` | **Yes** | Remove movie from user's wishlist |

## Environment Variables

Create `.env` inside `backend/`:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5174

TMDB_API_KEY=your_tmdb_api_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Getting Started

```bash
npm install
npm run dev
```

Server runs at `http://localhost:3000`.
