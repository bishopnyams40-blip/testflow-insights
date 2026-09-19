-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.device_platform AS ENUM ('IPHONE','ANDROID','IPAD','MAC','WINDOWS','LINUX','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attribute_verification_status AS ENUM ('UNVERIFIED','PENDING','VERIFIED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Columns
ALTER TABLE public.tester_profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS account_status public.user_status NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS completed_jobs_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejected_jobs_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expired_jobs_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scores_calculated_at timestamptz;

ALTER TABLE public.tester_devices
  ADD COLUMN IF NOT EXISTS platform public.device_platform NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS verification_status public.attribute_verification_status NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.tester_skills
  ADD COLUMN IF NOT EXISTS verification_status public.attribute_verification_status NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tester_verifications
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Integrity
CREATE UNIQUE INDEX IF NOT EXISTS tester_devices_unique_idx
  ON public.tester_devices (tester_id, platform, coalesce(model,''), coalesce(os_version,''), coalesce(browser,''));

CREATE INDEX IF NOT EXISTS tester_profiles_country_idx ON public.tester_profiles (country);
CREATE INDEX IF NOT EXISTS tester_profiles_account_status_idx ON public.tester_profiles (account_status);
CREATE INDEX IF NOT EXISTS tester_profiles_availability_idx ON public.tester_profiles (availability_status);
CREATE INDEX IF NOT EXISTS tester_profiles_verification_idx ON public.tester_profiles (verification_status);
CREATE INDEX IF NOT EXISTS tester_profiles_experience_idx ON public.tester_profiles (experience_level);
CREATE INDEX IF NOT EXISTS tester_devices_platform_idx ON public.tester_devices (platform);
CREATE INDEX IF NOT EXISTS tester_devices_status_idx ON public.tester_devices (verification_status);
CREATE INDEX IF NOT EXISTS tester_skills_skill_idx ON public.tester_skills (skill);

-- 4. Protected-field enforcement (database authority, not UI)
CREATE OR REPLACE FUNCTION public.guard_tester_profile_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF NEW.quality_score IS DISTINCT FROM OLD.quality_score
     OR NEW.reliability_score IS DISTINCT FROM OLD.reliability_score
     OR NEW.completion_rate IS DISTINCT FROM OLD.completion_rate
     OR NEW.fraud_risk_score IS DISTINCT FROM OLD.fraud_risk_score
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.account_status IS DISTINCT FROM OLD.account_status
     OR NEW.completed_jobs_count IS DISTINCT FROM OLD.completed_jobs_count
     OR NEW.rejected_jobs_count IS DISTINCT FROM OLD.rejected_jobs_count
     OR NEW.expired_jobs_count IS DISTINCT FROM OLD.expired_jobs_count
     OR NEW.scores_calculated_at IS DISTINCT FROM OLD.scores_calculated_at
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Protected tester fields can only be changed by TestFlow administrators';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_tester_profile_protected_fields ON public.tester_profiles;
CREATE TRIGGER guard_tester_profile_protected_fields
BEFORE UPDATE ON public.tester_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_tester_profile_protected_fields();

CREATE OR REPLACE FUNCTION public.guard_tester_device_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
    NEW.verification_status := 'UNVERIFIED';
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.tester_id IS DISTINCT FROM OLD.tester_id THEN
    RAISE EXCEPTION 'Device verification can only be changed by TestFlow administrators';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_tester_device_protected_fields ON public.tester_devices;
CREATE TRIGGER guard_tester_device_protected_fields
BEFORE INSERT OR UPDATE ON public.tester_devices
FOR EACH ROW EXECUTE FUNCTION public.guard_tester_device_protected_fields();

CREATE OR REPLACE FUNCTION public.guard_tester_skill_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
    NEW.verification_status := 'UNVERIFIED';
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    RETURN NEW;
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.tester_id IS DISTINCT FROM OLD.tester_id THEN
    RAISE EXCEPTION 'Skill verification can only be changed by TestFlow administrators';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_tester_skill_protected_fields ON public.tester_skills;
CREATE TRIGGER guard_tester_skill_protected_fields
BEFORE INSERT OR UPDATE ON public.tester_skills
FOR EACH ROW EXECUTE FUNCTION public.guard_tester_skill_protected_fields();

CREATE OR REPLACE FUNCTION public.guard_tester_verification_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Verification outcomes can only be changed by TestFlow administrators';
END $$;

DROP TRIGGER IF EXISTS guard_tester_verification_outcome ON public.tester_verifications;
CREATE TRIGGER guard_tester_verification_outcome
BEFORE INSERT OR UPDATE ON public.tester_verifications
FOR EACH ROW EXECUTE FUNCTION public.guard_tester_verification_outcome();

-- 5. Audit + notification helper (admin-only paths)
CREATE OR REPLACE FUNCTION public.record_tester_audit(
  _action text, _entity_type text, _entity_id uuid,
  _previous jsonb, _new jsonb, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, previous_value, new_value, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _previous, _new, coalesce(_metadata,'{}'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.record_tester_audit(text,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_tester(_user_id uuid, _event text, _title text, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, channel, event_type, title, body, status)
  VALUES (_user_id, 'IN_APP', _event, _title, _body, 'PENDING');
END $$;
REVOKE ALL ON FUNCTION public.notify_tester(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

-- 6. Admin operations
CREATE OR REPLACE FUNCTION public.admin_set_tester_status(_tester_id uuid, _status public.user_status, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.user_status; _uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT account_status, user_id INTO _old, _uid FROM public.tester_profiles WHERE id = _tester_id;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Tester not found'; END IF;
  UPDATE public.tester_profiles SET account_status = _status, updated_at = now() WHERE id = _tester_id;
  PERFORM public.record_tester_audit('TESTER_STATUS_CHANGED','tester_profile',_tester_id,
    jsonb_build_object('account_status',_old), jsonb_build_object('account_status',_status),
    jsonb_build_object('reason',_reason));
  PERFORM public.notify_tester(_uid,'TESTER_STATUS_CHANGED','Your tester account status changed',
    'Your account status is now ' || _status::text || '.');
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_tester_availability(_tester_id uuid, _availability public.availability_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.availability_status;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT availability_status INTO _old FROM public.tester_profiles WHERE id = _tester_id;
  IF _old IS NULL THEN RAISE EXCEPTION 'Tester not found'; END IF;
  UPDATE public.tester_profiles SET availability_status = _availability, updated_at = now() WHERE id = _tester_id;
  PERFORM public.record_tester_audit('TESTER_AVAILABILITY_CHANGED','tester_profile',_tester_id,
    jsonb_build_object('availability_status',_old), jsonb_build_object('availability_status',_availability), '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_device(_device_id uuid, _status public.attribute_verification_status, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.attribute_verification_status; _uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT d.verification_status, p.user_id INTO _old, _uid
  FROM public.tester_devices d JOIN public.tester_profiles p ON p.id = d.tester_id WHERE d.id = _device_id;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Device not found'; END IF;
  UPDATE public.tester_devices
     SET verification_status = _status,
         verified = (_status = 'VERIFIED'),
         verified_at = CASE WHEN _status = 'VERIFIED' THEN now() ELSE NULL END,
         verified_by = auth.uid(),
         rejection_reason = CASE WHEN _status = 'REJECTED' THEN _reason ELSE NULL END,
         updated_at = now()
   WHERE id = _device_id;
  PERFORM public.record_tester_audit('TESTER_DEVICE_REVIEWED','tester_device',_device_id,
    jsonb_build_object('verification_status',_old), jsonb_build_object('verification_status',_status),
    jsonb_build_object('reason',_reason));
  PERFORM public.notify_tester(_uid,'TESTER_DEVICE_REVIEWED','Device review updated',
    'One of your devices is now ' || _status::text || '.');
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_skill(_skill_id uuid, _status public.attribute_verification_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.attribute_verification_status; _uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT s.verification_status, p.user_id INTO _old, _uid
  FROM public.tester_skills s JOIN public.tester_profiles p ON p.id = s.tester_id WHERE s.id = _skill_id;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Skill not found'; END IF;
  UPDATE public.tester_skills
     SET verification_status = _status, verified = (_status = 'VERIFIED'),
         verified_at = CASE WHEN _status = 'VERIFIED' THEN now() ELSE NULL END,
         verified_by = auth.uid(), updated_at = now()
   WHERE id = _skill_id;
  PERFORM public.record_tester_audit('TESTER_SKILL_REVIEWED','tester_skill',_skill_id,
    jsonb_build_object('verification_status',_old), jsonb_build_object('verification_status',_status), '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_verification(
  _tester_id uuid, _type public.verification_type, _status public.verification_status, _reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.verification_status; _uid uuid; _vid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT user_id INTO _uid FROM public.tester_profiles WHERE id = _tester_id;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Tester not found'; END IF;
  SELECT id, status INTO _vid, _old FROM public.tester_verifications
   WHERE tester_id = _tester_id AND verification_type = _type;
  IF _vid IS NULL THEN
    INSERT INTO public.tester_verifications (tester_id, verification_type, status, verified_at, rejection_reason, reviewed_by)
    VALUES (_tester_id, _type, _status, CASE WHEN _status='VERIFIED' THEN now() END,
            CASE WHEN _status='REJECTED' THEN _reason END, auth.uid())
    RETURNING id INTO _vid;
  ELSE
    UPDATE public.tester_verifications
       SET status = _status,
           verified_at = CASE WHEN _status='VERIFIED' THEN now() ELSE NULL END,
           rejection_reason = CASE WHEN _status='REJECTED' THEN _reason ELSE NULL END,
           reviewed_by = auth.uid(), updated_at = now()
     WHERE id = _vid;
  END IF;
  PERFORM public.record_tester_audit('TESTER_VERIFICATION_REVIEWED','tester_verification',_vid,
    jsonb_build_object('status',_old), jsonb_build_object('status',_status,'type',_type),
    jsonb_build_object('reason',_reason,'tester_id',_tester_id));
  PERFORM public.notify_tester(_uid,'TESTER_VERIFICATION_REVIEWED','Verification updated',
    _type::text || ' verification is now ' || _status::text || '.');
END $$;

-- 7. Admin tester list: server-side search, filter, pagination, single query
CREATE OR REPLACE FUNCTION public.admin_list_testers(
  _search text DEFAULT NULL,
  _account_status public.user_status DEFAULT NULL,
  _availability public.availability_status DEFAULT NULL,
  _verification public.verification_status DEFAULT NULL,
  _experience public.experience_level DEFAULT NULL,
  _country text DEFAULT NULL,
  _platform public.device_platform DEFAULT NULL,
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, user_id uuid, email text, first_name text, last_name text,
  country text, city text, timezone text,
  experience_level public.experience_level,
  account_status public.user_status,
  availability_status public.availability_status,
  verification_status public.verification_status,
  device_count bigint, skill_count bigint, created_at timestamptz, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  WITH filtered AS (
    SELECT tp.*, pr.email AS pr_email, pr.first_name AS pr_first, pr.last_name AS pr_last
    FROM public.tester_profiles tp
    JOIN public.profiles pr ON pr.id = tp.user_id
    WHERE (_search IS NULL OR _search = '' OR pr.email ILIKE '%'||_search||'%'
           OR coalesce(pr.first_name,'') ILIKE '%'||_search||'%'
           OR coalesce(pr.last_name,'') ILIKE '%'||_search||'%')
      AND (_account_status IS NULL OR tp.account_status = _account_status)
      AND (_availability IS NULL OR tp.availability_status = _availability)
      AND (_verification IS NULL OR tp.verification_status = _verification)
      AND (_experience IS NULL OR tp.experience_level = _experience)
      AND (_country IS NULL OR _country = '' OR tp.country = _country)
      AND (_platform IS NULL OR EXISTS (
            SELECT 1 FROM public.tester_devices d WHERE d.tester_id = tp.id AND d.platform = _platform))
  ), counted AS (SELECT count(*) AS total FROM filtered)
  SELECT f.id, f.user_id, f.pr_email, f.pr_first, f.pr_last,
         f.country, f.city, f.timezone, f.experience_level, f.account_status,
         f.availability_status, f.verification_status,
         (SELECT count(*) FROM public.tester_devices d WHERE d.tester_id = f.id),
         (SELECT count(*) FROM public.tester_skills s WHERE s.tester_id = f.id),
         f.created_at, c.total
  FROM filtered f CROSS JOIN counted c
  ORDER BY f.created_at DESC
  LIMIT greatest(1, least(coalesce(_limit,20), 100)) OFFSET greatest(0, coalesce(_offset,0));
END $$;

CREATE OR REPLACE FUNCTION public.admin_tester_network_stats()
RETURNS TABLE (total bigint, active bigint, pending_verification bigint, suspended bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT count(*),
    count(*) FILTER (WHERE account_status = 'ACTIVE'),
    count(*) FILTER (WHERE verification_status = 'PENDING'),
    count(*) FILTER (WHERE account_status = 'SUSPENDED')
  FROM public.tester_profiles;
END $$;