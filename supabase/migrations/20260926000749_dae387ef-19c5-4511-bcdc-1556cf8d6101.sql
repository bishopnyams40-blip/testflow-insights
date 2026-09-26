CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER FUNCTION public.invitation_create(text,uuid,recruitment_source,text,integer) SET search_path = public, extensions;
ALTER FUNCTION public.invitation_accept(text) SET search_path = public, extensions;