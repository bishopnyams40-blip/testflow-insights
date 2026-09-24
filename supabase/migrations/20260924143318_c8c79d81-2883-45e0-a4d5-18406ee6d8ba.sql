ALTER FUNCTION public.requirement_matches(requirement_operator, jsonb, text[]) SET search_path = public;
ALTER FUNCTION public.experience_rank(text) SET search_path = public;
ALTER FUNCTION public.opportunity_is_requestable(public.opportunities) SET search_path = public;