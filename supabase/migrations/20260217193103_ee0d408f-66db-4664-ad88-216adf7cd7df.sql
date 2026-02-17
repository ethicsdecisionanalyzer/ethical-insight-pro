CREATE POLICY "Users can update their own submissions"
ON public.case_submissions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);