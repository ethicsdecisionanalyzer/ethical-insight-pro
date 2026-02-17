
-- Add consent tracking fields to case_submissions
ALTER TABLE public.case_submissions
ADD COLUMN consent_no_confidential boolean NOT NULL DEFAULT false,
ADD COLUMN consent_aggregate_use boolean NOT NULL DEFAULT false;
