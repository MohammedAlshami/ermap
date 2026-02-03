-- Projects: each belongs to a user; config stores slides/map state; share_id for public view.
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}',
  share_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Anon has no direct access; public view is served by API (service role) at GET /api/projects/public/:shareId
CREATE POLICY "No anon projects"
  ON public.projects
  FOR ALL
  TO anon
  USING (false);

-- Service role full access (API server uses service role)
CREATE POLICY "Service role full access projects"
  ON public.projects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS projects_share_id_idx ON public.projects (share_id);
