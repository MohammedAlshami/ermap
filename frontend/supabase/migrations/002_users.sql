-- Users table for custom auth (no Supabase Auth). App hashes passwords (e.g. bcrypt).
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- No anon access to users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No anon users"
  ON public.users
  FOR ALL
  TO anon
  USING (false);

-- Service role can do everything (used by API server)
CREATE POLICY "Service role full access users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
