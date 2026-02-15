
-- Add analysis_result column to store AI analysis JSON
ALTER TABLE public.case_submissions
ADD COLUMN analysis_result JSONB;
