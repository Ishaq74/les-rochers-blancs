-- Fix overly permissive INSERT policy on comments
-- Replace WITH CHECK (true) with proper validation

DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;

CREATE POLICY "Anyone can insert comments with valid data" ON public.comments
  FOR INSERT WITH CHECK (
    author_name IS NOT NULL AND 
    author_email IS NOT NULL AND 
    content IS NOT NULL AND
    length(author_name) > 0 AND
    length(content) > 0
  );