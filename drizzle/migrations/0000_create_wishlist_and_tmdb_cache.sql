CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  release_date text,
  vote_average numeric,
  overview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wishlist"
  ON public.wishlist_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlist_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist"
  ON public.wishlist_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON public.wishlist_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX wishlist_items_user_created_idx ON public.wishlist_items (user_id, created_at DESC);

CREATE TABLE public.tmdb_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.tmdb_cache TO service_role;

ALTER TABLE public.tmdb_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX tmdb_cache_expires_idx ON public.tmdb_cache (expires_at);