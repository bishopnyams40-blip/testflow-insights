CREATE OR REPLACE FUNCTION public.guard_tester_verification_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'PENDING';
    NEW.verified_at := NULL;
    NEW.rejection_reason := NULL;
    NEW.reviewed_by := NULL;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Verification outcomes can only be changed by TestFlow administrators';
END $$;