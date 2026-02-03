-- GeoJSON datasets: slug lookup for /api/files/{slug}. Run once in Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS public.geojson_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text,
  format text,
  metadata jsonb,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Optional: allow anon to read (for future client-side use). service_role bypasses RLS.
ALTER TABLE public.geojson_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read"
  ON public.geojson_datasets
  FOR SELECT
  TO anon
  USING (true);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS geojson_datasets_slug_idx ON public.geojson_datasets (slug);
