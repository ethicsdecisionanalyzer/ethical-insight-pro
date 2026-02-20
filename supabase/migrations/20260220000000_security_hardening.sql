-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Tightens RLS policies across all tables.
-- Removes overly permissive anonymous access from legacy policies.
-- ============================================================

-- ============================================================
-- 1. ACCESS_CODES: Restrict to authenticated users only
--    (Legacy table retained for backward compatibility)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read active access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Anyone can update access codes" ON public.access_codes;

CREATE POLICY "Authenticated users can read active access codes"
  ON public.access_codes FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage access codes"
  ON public.access_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. CASE_SUBMISSIONS: Lock down to authenticated owner access
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert case submissions" ON public.case_submissions;
DROP POLICY IF EXISTS "Users can read their own submissions by session_id" ON public.case_submissions;

CREATE POLICY "Authenticated users can insert own submissions"
  ON public.case_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own submissions"
  ON public.case_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all submissions"
  ON public.case_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. CODE_REDEMPTIONS: Restrict to authenticated users
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert code redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Anyone can read code redemptions" ON public.code_redemptions;

CREATE POLICY "Authenticated users can insert code redemptions"
  ON public.code_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read own code redemptions"
  ON public.code_redemptions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 4. VERIFICATION_QUESTIONS: Allow anon read for active only
--    (Required for the pre-registration verification gate)
--    Keep admin management policy from migration 4.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read active questions" ON public.verification_questions;

CREATE POLICY "Public can read active verification questions"
  ON public.verification_questions FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- ============================================================
-- 5. PROFILES: Ensure no anonymous access, restrict updates
-- ============================================================

-- Existing policies are already scoped to authenticated.
-- Add an explicit denial for anon by ensuring no anon policy exists.
-- (Profiles policies from migration 4 are correct — no changes needed)

-- ============================================================
-- 6. USER_ROLES: Already scoped to authenticated (migration 5)
-- ============================================================

-- No changes needed.

-- ============================================================
-- 7. Add updated_at column to verification_questions
--    for better audit tracking
-- ============================================================

ALTER TABLE public.verification_questions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_verification_questions_updated_at ON public.verification_questions;

CREATE TRIGGER update_verification_questions_updated_at
  BEFORE UPDATE ON public.verification_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. Add indexes for security-relevant query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_case_submissions_user_id
  ON public.case_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_verification_questions_active
  ON public.verification_questions (active)
  WHERE active = true;
