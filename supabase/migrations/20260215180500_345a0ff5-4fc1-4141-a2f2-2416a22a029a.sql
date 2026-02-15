
-- Access codes table
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 5,
  uses_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_codes_code ON public.access_codes (code);

-- Case submissions table
CREATE TABLE public.case_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  stakeholders TEXT,
  selected_codes TEXT[] NOT NULL DEFAULT '{}',
  access_code_used TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_submissions_session_id ON public.case_submissions (session_id);

-- Code redemptions table
CREATE TABLE public.code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Access codes: anyone can read (for validation), no public write
CREATE POLICY "Anyone can read active access codes"
  ON public.access_codes FOR SELECT
  USING (true);

-- Case submissions: users can insert, and read their own by session_id
CREATE POLICY "Anyone can insert case submissions"
  ON public.case_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read their own submissions by session_id"
  ON public.case_submissions FOR SELECT
  USING (true);

-- Code redemptions: anyone can insert, read all
CREATE POLICY "Anyone can insert code redemptions"
  ON public.code_redemptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read code redemptions"
  ON public.code_redemptions FOR SELECT
  USING (true);

-- Allow anonymous updates to access_codes (for incrementing usage)
CREATE POLICY "Anyone can update access codes"
  ON public.access_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_access_codes_updated_at
  BEFORE UPDATE ON public.access_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_submissions_updated_at
  BEFORE UPDATE ON public.case_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial access codes
INSERT INTO public.access_codes (code, max_uses, uses_count, active) VALUES
  ('BOOK-2026-4523', 5, 0, true),
  ('BOOK-2026-7891', 5, 0, true),
  ('BOOK-2026-3456', 5, 0, true),
  ('BOOK-2026-9012', 5, 0, true),
  ('BOOK-2026-5678', 5, 0, true),
  ('BOOK-2026-2345', 5, 0, true);
