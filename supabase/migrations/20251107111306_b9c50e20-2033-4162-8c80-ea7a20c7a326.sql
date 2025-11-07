-- Fix search_path for get_average_rating function
CREATE OR REPLACE FUNCTION public.get_average_rating(
  p_target_type TEXT,
  p_target_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM public.reviews
  WHERE target_type = p_target_type
    AND target_id = p_target_id;
$$;

-- Fix search_path for get_review_count function
CREATE OR REPLACE FUNCTION public.get_review_count(
  p_target_type TEXT,
  p_target_id UUID
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.reviews
  WHERE target_type = p_target_type
    AND target_id = p_target_id;
$$;