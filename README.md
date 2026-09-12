# Cineframe (reel-discover-pro)

Cineframe is a full-stack movie discovery application. Browse and search TMDB movies, view detailed movie pages with cast & recommendations, sign in with email and password, and manage your personal wishlist.

---

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, TypeScript, React Router v7, TanStack Query v5, Tailwind CSS v4, shadcn/ui primitives, Sonner toasts
- **Backend:** Node.js 20+, Express, TypeScript, Zod validation, Helmet security headers, CORS protection, rate limiting
- **Data & Auth:** TMDB API v3/v4 integration with response normalization, caching, retries, and Supabase Auth with fallback local session support

---

## 📁 Project Structure

```text
reel-discover-pro/
├── frontend/             # Vite + React client application
│   ├── src/
│   │   ├── components/   # React components & shadcn UI primitives
│   │   ├── hooks/        # Custom hooks (useAuth, useWishlist, etc.)
│   │   ├── pages/        # Route views (Browse, MovieDetail, Wishlist, Auth)
│   │   ├── services/     # Frontend API client methods
│   │   └── types/        # Shared frontend TypeScript declarations
├── backend/              # Node.js + Express API server
│   ├── src/
│   │   ├── controllers/  # Route controller logic
│   │   ├── middleware/   # Auth verification & rate limiting middleware
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # TMDB API & Wishlist database services
│   │   └── server.ts     # Express server entry point
├── ARCHITECTURE.md       # Technical system design & architecture documentation
└── roadmap.md            # Completed project milestones & verification roadmap
```

---

## 🔑 Environment Setup

### 1. Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5174

TMDB_API_KEY=your_tmdb_api_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_service_role_key
```

### 2. Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

---

## 🛠️ Running Locally

### Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Start Servers

In terminal 1 (Backend API):
```bash
cd backend
npm run dev
# Starts API server on http://localhost:3000
```

In terminal 2 (Frontend Client):
```bash
cd frontend
npm run dev
# Starts Vite application on http://localhost:5174
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 🧪 Testing & Verification Commands

### Backend Commands (`backend/`)

```bash
npm run dev        # Start development API with tsx watch
npm test           # Run automated Node unit test suite
npm run typecheck  # Verify TypeScript compilation (0 errors)
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled production server
```

### Frontend Commands (`frontend/`)

```bash
npm run dev        # Start Vite dev server
npm run typecheck  # Verify TypeScript compilation (0 errors)
npm run build      # Typecheck and build production assets in dist/
npm run preview    # Preview production build locally
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | API status & health check |
| `GET` | `/api/movies` | No | Browse movies with genre, rating, and page filters |
| `GET` | `/api/movies/search` | No | Search movies by title with debouncing |
| `GET` | `/api/movies/:movieId` | No | Get movie details, cast list, and similar movies |
| `GET` | `/api/genres` | No | Fetch list of available movie genres |
| `GET` | `/api/wishlist` | Yes | Retrieve the signed-in user's wishlist |
| `POST` | `/api/wishlist` | Yes | Save a movie to the wishlist |
| `DELETE` | `/api/wishlist/:movieId` | Yes | Remove a movie from the wishlist |

---

## 🗄️ Database Setup (Supabase SQL)

To create the wishlist table in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date TEXT,
  vote_average NUMERIC,
  overview TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, movie_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist items"
  ON public.wishlist_items FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## ✨ Key Features

- **Instant Direct Authentication**: Fast email & password authentication with automatic session fallback.
- **TMDB Integration**: Server-side normalization, response caching, rate-limit retries, and stale fallback.
- **Wishlist Resiliency**: Support for both Supabase Postgres storage and seamless session-based wishlist fallback.
- **Responsive Cinema UI**: Dark theme design system built with Tailwind CSS v4 and Lucide icons.
- **Full Type Safety**: Clean TypeScript compilation with 0 compiler errors across frontend and backend packages.
