-- ============================================================
-- MILESTONE 3 MIGRATION
-- PDF export tracking, storage bucket, code_redemptions audit
-- ============================================================

-- 1. PDF export tracking table
CREATE TABLE public.case_pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_submission_id UUID NOT NULL REFERENCES public.case_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT NOT NULL DEFAULT '',
  generation_status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_pdf_exports_case ON public.case_pdf_exports (case_submission_id, created_at DESC);
CREATE INDEX idx_case_pdf_exports_user ON public.case_pdf_exports (user_id, created_at DESC);

ALTER TABLE public.case_pdf_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own PDF exports"
  ON public.case_pdf_exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all PDF exports"
  ON public.case_pdf_exports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Enhance code_redemptions with user audit trail
ALTER TABLE public.code_redemptions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_created
  ON public.code_redemptions (code_id, created_at DESC);

CREATE POLICY "Admins can read all code redemptions"
  ON public.code_redemptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Non-negative constraint on access code usage
UPDATE public.access_codes SET uses_count = 0 WHERE uses_count < 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'access_codes_uses_count_non_negative'
  ) THEN
    ALTER TABLE public.access_codes
      ADD CONSTRAINT access_codes_uses_count_non_negative CHECK (uses_count >= 0);
  END IF;
END $$;

-- 4. Private storage bucket for PDF exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-pdf-exports', 'case-pdf-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can download own PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'case-pdf-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
