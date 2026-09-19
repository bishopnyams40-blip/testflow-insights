ALTER TYPE public.availability_status ADD VALUE IF NOT EXISTS 'LIMITED';
ALTER TYPE public.experience_level ADD VALUE IF NOT EXISTS 'EXPERIENCED';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'NOT_STARTED';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'REJECTED';