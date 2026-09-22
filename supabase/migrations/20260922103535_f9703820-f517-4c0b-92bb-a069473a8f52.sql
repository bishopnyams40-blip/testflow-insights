
-- =========================================================
-- PROMPT 005 — Opportunities & Recruitment Engine (additive)
-- =========================================================

CREATE TYPE public.opportunity_status AS ENUM ('DRAFT','OPEN','PAUSED','FULL','CLOSED','EXPIRED','CANCELLED');
CREATE TYPE public.job_request_status AS ENUM ('REQUESTED','UNDER_REVIEW','APPROVED','REJECTED','WITHDRAWN','EXPIRED');
CREATE TYPE public.recruitment_source AS ENUM ('TESTFLOW_NETWORK','UPWORK','REFERRAL','DIRECT_INVITATION','OTHER');
CREATE TYPE public.invitation_status AS ENUM ('PENDING','SENT','ACCEPTED','EXPIRED','CANCELLED');

-- ------------------------- opportunities -------------------------
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status public.opportunity_status NOT NULL DEFAULT 'DRAFT',
  slots_total integer NOT NULL DEFAULT 1,
  slots_requested integer NOT NULL DEFAULT 0,
  slots_filled integer NOT NULL DEFAULT 0,
  opens_at timestamptz,
  closes_at timestamptz,
  recruitment_source public.recruitment_source NOT NULL DEFAULT 'TESTFLOW_NETWORK',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opportunities_slots_total_ck CHECK (slots_total >= 1),
  CONSTRAINT opportunities_slots_requested_ck CHECK (slots_requested >= 0 AND slots_requested <= slots_total),
  CONSTRAINT opportunities_slots_filled_ck CHECK (slots_filled >= 0 AND slots_filled <= slots_total),
  CONSTRAINT opportunities_title_ck CHECK (btrim(title) <> '')
);

GRANT SELECT ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_opportunities_campaign ON public.opportunities(campaign_id);
CREATE INDEX idx_opportunities_status ON public.opportunities(status);
CREATE INDEX idx_opportunities_window ON public.opportunities(opens_at, closes_at);
CREATE INDEX idx_opportunities_source ON public.opportunities(recruitment_source);

CREATE TRIGGER set_opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------- job requests -------------------------
CREATE TABLE public.job_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  tester_id uuid NOT NULL REFERENCES public.tester_profiles(id) ON DELETE CASCADE,
  status public.job_request_status NOT NULL DEFAULT 'REQUESTED',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.job_requests TO authenticated;
GRANT ALL ON public.job_requests TO service_role;
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX uq_job_requests_active ON public.job_requests(opportunity_id, tester_id)
  WHERE status IN ('REQUESTED','UNDER_REVIEW','APPROVED');
CREATE INDEX idx_job_requests_opportunity ON public.job_requests(opportunity_id, status);
CREATE INDEX idx_job_requests_tester ON public.job_requests(tester_id, status);

CREATE TRIGGER set_job_requests_updated_at BEFORE UPDATE ON public.job_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------- invitations -------------------------
CREATE TABLE public.tester_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  source public.recruitment_source NOT NULL DEFAULT 'DIRECT_INVITATION',
  status public.invitation_status NOT NULL DEFAULT 'PENDING',
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tester_invitations_email_ck CHECK (position('@' in email) > 1)
);

GRANT SELECT ON public.tester_invitations TO authenticated;
GRANT ALL ON public.tester_invitations TO service_role;
ALTER TABLE public.tester_invitations ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX uq_tester_invitations_token ON public.tester_invitations(token_hash);
CREATE INDEX idx_tester_invitations_status ON public.tester_invitations(status);
CREATE INDEX idx_tester_invitations_email ON public.tester_invitations(lower(email));

CREATE TRIGGER set_tester_invitations_updated_at BEFORE UPDATE ON public.tester_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------- helpers -------------------------
CREATE OR REPLACE FUNCTION public.current_tester_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id FROM public.tester_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.experience_rank(_value text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE upper(coalesce(_value,''))
    WHEN 'BEGINNER' THEN 1
    WHEN 'INTERMEDIATE' THEN 2
    WHEN 'EXPERIENCED' THEN 3
    WHEN 'ADVANCED' THEN 3
    WHEN 'EXPERT' THEN 4
    ELSE 0 END;
$$;

-- Evaluate one requirement against a set of tester-side candidate values.
CREATE OR REPLACE FUNCTION public.requirement_matches(
  _operator public.requirement_operator, _value jsonb, _candidates text[]
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE wanted text[]; c text; n numeric; wn numeric;
BEGIN
  IF _candidates IS NULL OR array_length(_candidates,1) IS NULL THEN
    RETURN _operator IN ('NOT_EQUALS','NOT_IN');
  END IF;

  IF jsonb_typeof(_value) = 'array' THEN
    SELECT array_agg(upper(btrim(x))) INTO wanted FROM jsonb_array_elements_text(_value) AS t(x);
  ELSIF jsonb_typeof(_value) = 'string' THEN
    wanted := ARRAY[upper(btrim(_value #>> '{}'))];
  ELSE
    wanted := ARRAY[upper(btrim(coalesce(_value #>> '{}','')))];
  END IF;

  IF _operator = 'EQUALS' OR _operator = 'IN' THEN
    RETURN EXISTS (SELECT 1 FROM unnest(_candidates) v WHERE upper(btrim(v)) = ANY(wanted));
  ELSIF _operator = 'NOT_EQUALS' OR _operator = 'NOT_IN' THEN
    RETURN NOT EXISTS (SELECT 1 FROM unnest(_candidates) v WHERE upper(btrim(v)) = ANY(wanted));
  ELSIF _operator = 'CONTAINS' THEN
    RETURN EXISTS (SELECT 1 FROM unnest(_candidates) v WHERE upper(v) LIKE '%' || wanted[1] || '%');
  ELSIF _operator = 'BOOLEAN_IS' THEN
    RETURN upper(btrim(_candidates[1])) = coalesce(wanted[1],'FALSE');
  ELSE
    -- numeric comparisons; experience labels are ranked
    BEGIN wn := (wanted[1])::numeric; EXCEPTION WHEN others THEN wn := public.experience_rank(wanted[1]); END;
    FOREACH c IN ARRAY _candidates LOOP
      BEGIN n := c::numeric; EXCEPTION WHEN others THEN n := public.experience_rank(c); END;
      IF (_operator = 'GREATER_THAN' AND n > wn)
        OR (_operator = 'GREATER_THAN_OR_EQUAL' AND n >= wn)
        OR (_operator = 'LESS_THAN' AND n < wn)
        OR (_operator = 'LESS_THAN_OR_EQUAL' AND n <= wn) THEN
        RETURN true;
      END IF;
    END LOOP;
    RETURN false;
  END IF;
END $$;

-- Eligibility: does the tester satisfy the campaign's required requirements?
CREATE OR REPLACE FUNCTION public.tester_meets_requirements(_tester_id uuid, _campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  t public.tester_profiles%ROWTYPE; r RECORD; unmet text[] := '{}'; cands text[];
  email_ok boolean; age_low numeric;
BEGIN
  SELECT * INTO t FROM public.tester_profiles WHERE id = _tester_id;
  IF t.id IS NULL THEN RETURN jsonb_build_object('eligible', false, 'unmet', to_jsonb(ARRAY['tester profile']::text[])); END IF;

  IF t.account_status <> 'ACTIVE' THEN unmet := unmet || 'active account'::text; END IF;
  IF t.availability_status = 'UNAVAILABLE' THEN unmet := unmet || 'availability'::text; END IF;

  SELECT EXISTS (SELECT 1 FROM public.tester_verifications v
    WHERE v.tester_id = _tester_id AND v.verification_type = 'EMAIL' AND v.status = 'VERIFIED')
  INTO email_ok;
  IF NOT email_ok THEN unmet := unmet || 'email verification'::text; END IF;

  FOR r IN SELECT * FROM public.campaign_requirements WHERE campaign_id = _campaign_id AND required LOOP
    cands := NULL;
    IF r.requirement_type = 'COUNTRY' THEN
      cands := ARRAY[coalesce(t.country,'')];
    ELSIF r.requirement_type = 'AGE_RANGE' THEN
      age_low := nullif(split_part(coalesce(t.age_range,''), '-', 1), '')::numeric;
      cands := ARRAY[coalesce(t.age_range,''), coalesce(age_low::text,'0')];
    ELSIF r.requirement_type = 'EXPERIENCE' THEN
      cands := ARRAY[t.experience_level::text];
    ELSIF r.requirement_type = 'AVAILABILITY' THEN
      cands := ARRAY[t.availability_status::text];
    ELSIF r.requirement_type = 'SKILL' THEN
      SELECT array_agg(skill) INTO cands FROM public.tester_skills WHERE tester_id = _tester_id;
    ELSIF r.requirement_type = 'DEVICE_PLATFORM' THEN
      SELECT array_agg(platform::text) INTO cands FROM public.tester_devices WHERE tester_id = _tester_id;
    ELSIF r.requirement_type = 'PRIOR_EXPOSURE' THEN
      cands := ARRAY[CASE WHEN EXISTS (
        SELECT 1 FROM public.job_requests jr
        JOIN public.opportunities o ON o.id = jr.opportunity_id
        WHERE jr.tester_id = _tester_id AND o.campaign_id = _campaign_id AND jr.status = 'APPROVED'
      ) THEN 'TRUE' ELSE 'FALSE' END];
    ELSE
      CONTINUE; -- OTHER requirements are informational for recruitment
    END IF;

    IF NOT public.requirement_matches(r.operator, r.value, cands) THEN
      unmet := unmet || lower(replace(r.requirement_type,'_',' '));
    END IF;
  END LOOP;

  RETURN jsonb_build_object('eligible', array_length(unmet,1) IS NULL, 'unmet', to_jsonb(unmet));
END $$;

-- Is an opportunity currently open for requests (server-authoritative)?
CREATE OR REPLACE FUNCTION public.opportunity_is_requestable(_o public.opportunities)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT _o.status = 'OPEN'
     AND (_o.opens_at IS NULL OR _o.opens_at <= now())
     AND (_o.closes_at IS NULL OR _o.closes_at > now())
     AND _o.slots_requested < _o.slots_total;
$$;

-- ------------------------- RLS policies -------------------------
CREATE POLICY "Admins manage opportunities" ON public.opportunities
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Org members read their opportunities" ON public.opportunities
  FOR SELECT TO authenticated USING (public.can_access_campaign(campaign_id));

CREATE POLICY "Testers read live opportunities" ON public.opportunities
  FOR SELECT TO authenticated USING (
    public.self_has_role('TESTER')
    AND status = 'OPEN'
    AND (opens_at IS NULL OR opens_at <= now())
    AND (closes_at IS NULL OR closes_at > now())
  );

CREATE POLICY "Admins manage job requests" ON public.job_requests
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Testers read their own requests" ON public.job_requests
  FOR SELECT TO authenticated USING (public.owns_tester_profile(tester_id));

CREATE POLICY "Admins manage invitations" ON public.tester_invitations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------- opportunity lifecycle -------------------------
CREATE OR REPLACE FUNCTION public.opportunity_create(
  _campaign_id uuid, _title text, _description text, _slots_total integer,
  _opens_at timestamptz, _closes_at timestamptz, _source public.recruitment_source DEFAULT 'TESTFLOW_NETWORK'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.campaigns%ROWTYPE; new_id uuid; core jsonb; svc jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF c.status IN ('CANCELLED','CLOSED','COMPLETED','DRAFT') THEN
    RAISE EXCEPTION 'Campaign is not ready for recruitment';
  END IF;
  core := public.campaign_core_completeness(_campaign_id);
  svc := public.campaign_service_completeness(_campaign_id);
  IF NOT (core->>'complete')::boolean OR NOT (svc->>'complete')::boolean THEN
    RAISE EXCEPTION 'Campaign is incomplete';
  END IF;
  IF coalesce(_slots_total,0) < 1 THEN RAISE EXCEPTION 'At least one slot is required'; END IF;
  IF _closes_at IS NOT NULL AND _opens_at IS NOT NULL AND _closes_at <= _opens_at THEN
    RAISE EXCEPTION 'Closing time must be after opening time';
  END IF;

  INSERT INTO public.opportunities (campaign_id, title, description, slots_total, opens_at, closes_at, recruitment_source, created_by)
  VALUES (_campaign_id, _title, nullif(btrim(coalesce(_description,'')),''), _slots_total, _opens_at, _closes_at, coalesce(_source,'TESTFLOW_NETWORK'), auth.uid())
  RETURNING id INTO new_id;

  PERFORM public.record_tester_audit('OPPORTUNITY_CREATED','opportunity',new_id,NULL,
    jsonb_build_object('campaign_id',_campaign_id,'slots_total',_slots_total,'source',_source));
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.opportunity_update_draft(
  _opportunity_id uuid, _title text, _description text, _slots_total integer,
  _opens_at timestamptz, _closes_at timestamptz, _source public.recruitment_source
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o public.opportunities%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO o FROM public.opportunities WHERE id = _opportunity_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
  IF o.status NOT IN ('DRAFT','PAUSED') THEN RAISE EXCEPTION 'Only draft or paused recruitment can be edited'; END IF;
  IF coalesce(_slots_total,0) < 1 THEN RAISE EXCEPTION 'At least one slot is required'; END IF;
  IF _slots_total < o.slots_requested THEN RAISE EXCEPTION 'Slots cannot be fewer than active requests'; END IF;
  IF _closes_at IS NOT NULL AND _opens_at IS NOT NULL AND _closes_at <= _opens_at THEN
    RAISE EXCEPTION 'Closing time must be after opening time';
  END IF;

  UPDATE public.opportunities SET
    title = _title,
    description = nullif(btrim(coalesce(_description,'')),''),
    slots_total = _slots_total,
    opens_at = _opens_at,
    closes_at = _closes_at,
    recruitment_source = coalesce(_source, o.recruitment_source)
  WHERE id = _opportunity_id;

  PERFORM public.record_tester_audit('OPPORTUNITY_UPDATED','opportunity',_opportunity_id,
    to_jsonb(o), jsonb_build_object('title',_title,'slots_total',_slots_total));
END $$;

CREATE OR REPLACE FUNCTION public.opportunity_set_status(
  _opportunity_id uuid, _status public.opportunity_status, _reason text DEFAULT NULL
) RETURNS public.opportunity_status LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o public.opportunities%ROWTYPE; allowed public.opportunity_status[];
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO o FROM public.opportunities WHERE id = _opportunity_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Opportunity not found'; END IF;

  allowed := CASE o.status
    WHEN 'DRAFT' THEN ARRAY['OPEN','CANCELLED']::public.opportunity_status[]
    WHEN 'OPEN' THEN ARRAY['PAUSED','FULL','CLOSED','EXPIRED','CANCELLED']::public.opportunity_status[]
    WHEN 'PAUSED' THEN ARRAY['OPEN','CLOSED','CANCELLED']::public.opportunity_status[]
    WHEN 'FULL' THEN ARRAY['OPEN','CLOSED','CANCELLED']::public.opportunity_status[]
    ELSE ARRAY[]::public.opportunity_status[]
  END;

  IF NOT (_status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Cannot move recruitment from % to %', o.status, _status;
  END IF;
  IF _status = 'OPEN' AND o.slots_requested >= o.slots_total THEN
    RAISE EXCEPTION 'Recruitment capacity is already reached';
  END IF;

  UPDATE public.opportunities
    SET status = _status,
        cancellation_reason = CASE WHEN _status = 'CANCELLED' THEN _reason ELSE cancellation_reason END
    WHERE id = _opportunity_id;

  PERFORM public.record_tester_audit('OPPORTUNITY_' || _status::text,'opportunity',_opportunity_id,
    jsonb_build_object('status',o.status), jsonb_build_object('status',_status,'reason',_reason));
  RETURN _status;
END $$;

-- Lazily expire opportunities whose closing time has passed.
CREATE OR REPLACE FUNCTION public.opportunity_expire_due()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  WITH upd AS (
    UPDATE public.opportunities SET status = 'EXPIRED'
    WHERE status IN ('OPEN','PAUSED','FULL') AND closes_at IS NOT NULL AND closes_at <= now()
    RETURNING id
  ) SELECT count(*) INTO n FROM upd;
  RETURN n;
END $$;

-- ------------------------- tester discovery -------------------------
CREATE OR REPLACE FUNCTION public.tester_list_opportunities(
  _search text DEFAULT NULL, _service public.service_type DEFAULT NULL,
  _limit integer DEFAULT 20, _offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, title text, description text, service_type public.service_type,
  product_type public.product_type, campaign_id uuid, slots_total integer,
  slots_requested integer, closes_at timestamptz, opens_at timestamptz,
  recruitment_source public.recruitment_source, request_status public.job_request_status,
  total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE tid uuid;
BEGIN
  tid := public.current_tester_id();
  IF tid IS NULL THEN RAISE EXCEPTION 'Tester profile not found'; END IF;

  RETURN QUERY
  WITH live AS (
    SELECT o.*, c.service_type AS c_service, c.product_type AS c_product
    FROM public.opportunities o
    JOIN public.campaigns c ON c.id = o.campaign_id
    WHERE o.status = 'OPEN'
      AND (o.opens_at IS NULL OR o.opens_at <= now())
      AND (o.closes_at IS NULL OR o.closes_at > now())
      AND o.slots_requested < o.slots_total
      AND (_service IS NULL OR c.service_type = _service)
      AND (_search IS NULL OR _search = '' OR o.title ILIKE '%' || _search || '%')
      AND (public.tester_meets_requirements(tid, o.campaign_id)->>'eligible')::boolean
      AND NOT EXISTS (
        SELECT 1 FROM public.job_requests jr
        WHERE jr.opportunity_id = o.id AND jr.tester_id = tid
          AND jr.status IN ('REJECTED','EXPIRED')
      )
  ), counted AS (SELECT count(*) AS n FROM live)
  SELECT l.id, l.title, l.description, l.c_service, l.c_product, l.campaign_id,
         l.slots_total, l.slots_requested, l.closes_at, l.opens_at, l.recruitment_source,
         (SELECT jr.status FROM public.job_requests jr
           WHERE jr.opportunity_id = l.id AND jr.tester_id = tid
           ORDER BY jr.created_at DESC LIMIT 1),
         (SELECT n FROM counted)
  FROM live l
  ORDER BY coalesce(l.closes_at, 'infinity'::timestamptz) ASC, l.created_at DESC
  LIMIT coalesce(_limit,20) OFFSET coalesce(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.tester_opportunity_detail(_opportunity_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE tid uuid; o public.opportunities%ROWTYPE; c public.campaigns%ROWTYPE; elig jsonb; req record;
BEGIN
  tid := public.current_tester_id();
  IF tid IS NULL THEN RAISE EXCEPTION 'Tester profile not found'; END IF;
  SELECT * INTO o FROM public.opportunities WHERE id = _opportunity_id;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = o.campaign_id;

  SELECT * INTO req FROM public.job_requests
   WHERE opportunity_id = o.id AND tester_id = tid ORDER BY created_at DESC LIMIT 1;

  IF NOT public.opportunity_is_requestable(o) AND req.id IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;

  elig := public.tester_meets_requirements(tid, o.campaign_id);

  RETURN jsonb_build_object(
    'id', o.id,
    'title', o.title,
    'description', o.description,
    'status', o.status,
    'opensAt', o.opens_at,
    'closesAt', o.closes_at,
    'slotsTotal', o.slots_total,
    'slotsRequested', o.slots_requested,
    'serviceType', c.service_type,
    'productType', c.product_type,
    'serviceConfig', c.service_config,
    'loginRequired', c.login_required,
    'eligibility', elig,
    'requestable', public.opportunity_is_requestable(o),
    'requestStatus', req.status,
    'requestId', req.id,
    'requestedAt', req.requested_at,
    'tasks', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'title', t.title, 'description', t.description, 'successCriteria', t.success_criteria,
        'maxDuration', t.max_duration, 'sequence', t.sequence, 'required', t.required)
        ORDER BY t.sequence) FROM public.campaign_tasks t WHERE t.campaign_id = c.id), '[]'::jsonb),
    'requirements', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'type', r.requirement_type, 'operator', r.operator, 'value', r.value, 'required', r.required)
        ) FROM public.campaign_requirements r WHERE r.campaign_id = c.id), '[]'::jsonb)
  );
END $$;

-- ------------------------- job request lifecycle -------------------------
CREATE OR REPLACE FUNCTION public.job_request_create(_opportunity_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE tid uuid; o public.opportunities%ROWTYPE; elig jsonb; new_id uuid; blocked text;
BEGIN
  tid := public.current_tester_id();
  IF tid IS NULL THEN RAISE EXCEPTION 'Tester profile not found'; END IF;

  -- row lock makes the capacity check and the counter update atomic
  SELECT * INTO o FROM public.opportunities WHERE id = _opportunity_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
  IF o.status <> 'OPEN' THEN RAISE EXCEPTION 'This opportunity is not open for requests'; END IF;
  IF o.opens_at IS NOT NULL AND o.opens_at > now() THEN RAISE EXCEPTION 'This opportunity has not opened yet'; END IF;
  IF o.closes_at IS NOT NULL AND o.closes_at <= now() THEN RAISE EXCEPTION 'This opportunity has closed'; END IF;
  IF o.slots_requested >= o.slots_total THEN RAISE EXCEPTION 'This opportunity is full'; END IF;

  SELECT jr.status::text INTO blocked FROM public.job_requests jr
   WHERE jr.opportunity_id = o.id AND jr.tester_id = tid
     AND jr.status IN ('REQUESTED','UNDER_REVIEW','APPROVED','REJECTED','EXPIRED')
   LIMIT 1;
  IF blocked IS NOT NULL THEN RAISE EXCEPTION 'You already have a % request for this opportunity', lower(blocked); END IF;

  elig := public.tester_meets_requirements(tid, o.campaign_id);
  IF NOT (elig->>'eligible')::boolean THEN RAISE EXCEPTION 'You do not meet the requirements for this opportunity'; END IF;

  INSERT INTO public.job_requests (opportunity_id, tester_id, status)
  VALUES (o.id, tid, 'REQUESTED') RETURNING id INTO new_id;

  UPDATE public.opportunities
    SET slots_requested = slots_requested + 1,
        status = CASE WHEN slots_requested + 1 >= slots_total THEN 'FULL'::public.opportunity_status ELSE status END
    WHERE id = o.id;

  PERFORM public.record_tester_audit('JOB_REQUEST_CREATED','job_request',new_id,NULL,
    jsonb_build_object('opportunity_id',o.id,'tester_id',tid));
  PERFORM public.notify_tester((SELECT user_id FROM public.tester_profiles WHERE id = tid),
    'JOB_REQUEST_RECEIVED','Request submitted','TestFlow has received your request for "' || o.title || '".');
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.job_request_withdraw(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.job_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.job_requests WHERE id = _request_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT public.owns_tester_profile(r.tester_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF r.status NOT IN ('REQUESTED','UNDER_REVIEW') THEN RAISE EXCEPTION 'This request can no longer be withdrawn'; END IF;

  UPDATE public.job_requests SET status = 'WITHDRAWN' WHERE id = _request_id;
  UPDATE public.opportunities
    SET slots_requested = greatest(slots_requested - 1, 0),
        status = CASE WHEN status = 'FULL' THEN 'OPEN'::public.opportunity_status ELSE status END
    WHERE id = r.opportunity_id;

  PERFORM public.record_tester_audit('JOB_REQUEST_WITHDRAWN','job_request',_request_id,
    jsonb_build_object('status',r.status), jsonb_build_object('status','WITHDRAWN'));
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_job_request(
  _request_id uuid, _status public.job_request_status, _reason text DEFAULT NULL
) RETURNS public.job_request_status LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.job_requests%ROWTYPE; o public.opportunities%ROWTYPE; allowed public.job_request_status[]; uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO r FROM public.job_requests WHERE id = _request_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;

  allowed := CASE r.status
    WHEN 'REQUESTED' THEN ARRAY['UNDER_REVIEW','APPROVED','REJECTED','EXPIRED']::public.job_request_status[]
    WHEN 'UNDER_REVIEW' THEN ARRAY['APPROVED','REJECTED','EXPIRED']::public.job_request_status[]
    ELSE ARRAY[]::public.job_request_status[]
  END;
  IF NOT (_status = ANY(allowed)) THEN RAISE EXCEPTION 'Cannot move request from % to %', r.status, _status; END IF;
  IF _status = 'REJECTED' AND coalesce(btrim(_reason),'') = '' THEN RAISE EXCEPTION 'A rejection reason is required'; END IF;

  UPDATE public.job_requests
    SET status = _status,
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        rejection_reason = CASE WHEN _status = 'REJECTED' THEN _reason ELSE rejection_reason END
    WHERE id = _request_id;

  IF _status IN ('REJECTED','EXPIRED') THEN
    UPDATE public.opportunities
      SET slots_requested = greatest(slots_requested - 1, 0),
          status = CASE WHEN status = 'FULL' THEN 'OPEN'::public.opportunity_status ELSE status END
      WHERE id = r.opportunity_id;
  END IF;

  SELECT * INTO o FROM public.opportunities WHERE id = r.opportunity_id;
  SELECT user_id INTO uid FROM public.tester_profiles WHERE id = r.tester_id;

  PERFORM public.record_tester_audit('JOB_REQUEST_' || _status::text,'job_request',_request_id,
    jsonb_build_object('status',r.status), jsonb_build_object('status',_status,'reason',_reason));

  IF _status = 'APPROVED' THEN
    PERFORM public.notify_tester(uid,'JOB_REQUEST_APPROVED','Request approved',
      'You passed recruitment review for "' || o.title || '". TestFlow will confirm participation separately.');
  ELSIF _status = 'REJECTED' THEN
    PERFORM public.notify_tester(uid,'JOB_REQUEST_REJECTED','Request not taken forward',
      'Your request for "' || o.title || '" was not taken forward.');
  END IF;
  RETURN _status;
END $$;

-- ------------------------- tester request list -------------------------
CREATE OR REPLACE FUNCTION public.tester_list_requests(
  _status public.job_request_status DEFAULT NULL, _limit integer DEFAULT 20, _offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, opportunity_id uuid, title text, service_type public.service_type,
  status public.job_request_status, requested_at timestamptz, reviewed_at timestamptz,
  rejection_reason text, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE tid uuid;
BEGIN
  tid := public.current_tester_id();
  IF tid IS NULL THEN RAISE EXCEPTION 'Tester profile not found'; END IF;
  RETURN QUERY
  WITH rows AS (
    SELECT jr.*, o.title AS o_title, c.service_type AS c_service
    FROM public.job_requests jr
    JOIN public.opportunities o ON o.id = jr.opportunity_id
    JOIN public.campaigns c ON c.id = o.campaign_id
    WHERE jr.tester_id = tid AND (_status IS NULL OR jr.status = _status)
  ), counted AS (SELECT count(*) AS n FROM rows)
  SELECT r.id, r.opportunity_id, r.o_title, r.c_service, r.status, r.requested_at, r.reviewed_at,
         r.rejection_reason, (SELECT n FROM counted)
  FROM rows r ORDER BY r.requested_at DESC
  LIMIT coalesce(_limit,20) OFFSET coalesce(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.tester_request_counters()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE tid uuid; res jsonb;
BEGIN
  tid := public.current_tester_id();
  IF tid IS NULL THEN RAISE EXCEPTION 'Tester profile not found'; END IF;
  SELECT jsonb_build_object(
    'total', count(*),
    'requested', count(*) FILTER (WHERE status = 'REQUESTED'),
    'underReview', count(*) FILTER (WHERE status = 'UNDER_REVIEW'),
    'approved', count(*) FILTER (WHERE status = 'APPROVED'),
    'rejected', count(*) FILTER (WHERE status = 'REJECTED'),
    'withdrawn', count(*) FILTER (WHERE status = 'WITHDRAWN'),
    'expired', count(*) FILTER (WHERE status = 'EXPIRED')
  ) INTO res FROM public.job_requests WHERE tester_id = tid;
  RETURN res;
END $$;

-- ------------------------- admin recruitment views -------------------------
CREATE OR REPLACE FUNCTION public.admin_recruitment_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE res jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT jsonb_build_object(
    'opportunities', (SELECT count(*) FROM public.opportunities),
    'open', (SELECT count(*) FROM public.opportunities WHERE status = 'OPEN'),
    'full', (SELECT count(*) FROM public.opportunities WHERE status = 'FULL'),
    'draft', (SELECT count(*) FROM public.opportunities WHERE status = 'DRAFT'),
    'slotsTotal', (SELECT coalesce(sum(slots_total),0) FROM public.opportunities WHERE status IN ('OPEN','PAUSED','FULL')),
    'slotsRequested', (SELECT coalesce(sum(slots_requested),0) FROM public.opportunities WHERE status IN ('OPEN','PAUSED','FULL')),
    'slotsFilled', (SELECT coalesce(sum(slots_filled),0) FROM public.opportunities),
    'campaignsAwaitingRecruitment', (SELECT count(*) FROM public.campaigns c
       WHERE c.status IN ('PAID','RECRUITING')
         AND NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.campaign_id = c.id AND o.status IN ('DRAFT','OPEN','PAUSED','FULL'))),
    'requestsTotal', (SELECT count(*) FROM public.job_requests),
    'requested', (SELECT count(*) FROM public.job_requests WHERE status = 'REQUESTED'),
    'underReview', (SELECT count(*) FROM public.job_requests WHERE status = 'UNDER_REVIEW'),
    'approved', (SELECT count(*) FROM public.job_requests WHERE status = 'APPROVED'),
    'rejected', (SELECT count(*) FROM public.job_requests WHERE status = 'REJECTED'),
    'withdrawn', (SELECT count(*) FROM public.job_requests WHERE status = 'WITHDRAWN'),
    'expired', (SELECT count(*) FROM public.job_requests WHERE status = 'EXPIRED'),
    'invitationsPending', (SELECT count(*) FROM public.tester_invitations WHERE status IN ('PENDING','SENT'))
  ) INTO res;
  RETURN res;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_opportunities(
  _search text DEFAULT NULL, _status public.opportunity_status DEFAULT NULL,
  _service public.service_type DEFAULT NULL, _source public.recruitment_source DEFAULT NULL,
  _campaign_id uuid DEFAULT NULL, _limit integer DEFAULT 20, _offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, title text, status public.opportunity_status, campaign_id uuid, campaign_name text,
  organization_name text, service_type public.service_type, slots_total integer,
  slots_requested integer, slots_filled integer, pending_requests bigint,
  recruitment_source public.recruitment_source, opens_at timestamptz, closes_at timestamptz,
  created_at timestamptz, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  WITH rows AS (
    SELECT o.*, c.name AS c_name, c.service_type AS c_service, org.name AS org_name
    FROM public.opportunities o
    JOIN public.campaigns c ON c.id = o.campaign_id
    JOIN public.organizations org ON org.id = c.organization_id
    WHERE (_status IS NULL OR o.status = _status)
      AND (_service IS NULL OR c.service_type = _service)
      AND (_source IS NULL OR o.recruitment_source = _source)
      AND (_campaign_id IS NULL OR o.campaign_id = _campaign_id)
      AND (_search IS NULL OR _search = '' OR o.title ILIKE '%'||_search||'%' OR c.name ILIKE '%'||_search||'%')
  ), counted AS (SELECT count(*) AS n FROM rows)
  SELECT r.id, r.title, r.status, r.campaign_id, r.c_name, r.org_name, r.c_service,
         r.slots_total, r.slots_requested, r.slots_filled,
         (SELECT count(*) FROM public.job_requests jr WHERE jr.opportunity_id = r.id AND jr.status IN ('REQUESTED','UNDER_REVIEW')),
         r.recruitment_source, r.opens_at, r.closes_at, r.created_at, (SELECT n FROM counted)
  FROM rows r ORDER BY r.created_at DESC
  LIMIT coalesce(_limit,20) OFFSET coalesce(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_job_requests(
  _opportunity_id uuid DEFAULT NULL, _status public.job_request_status DEFAULT NULL,
  _search text DEFAULT NULL, _limit integer DEFAULT 20, _offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, opportunity_id uuid, opportunity_title text, campaign_name text,
  service_type public.service_type, tester_id uuid, country text, age_range text,
  experience_level public.experience_level, availability_status public.availability_status,
  verification_status public.verification_status, quality_score numeric, reliability_score numeric,
  status public.job_request_status, requested_at timestamptz, reviewed_at timestamptz,
  rejection_reason text, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  WITH rows AS (
    SELECT jr.*, o.title AS o_title, o.campaign_id AS o_campaign, c.name AS c_name,
           c.service_type AS c_service, t.country AS t_country, t.age_range AS t_age,
           t.experience_level AS t_exp, t.availability_status AS t_avail,
           t.verification_status AS t_verif, t.quality_score AS t_quality, t.reliability_score AS t_rel
    FROM public.job_requests jr
    JOIN public.opportunities o ON o.id = jr.opportunity_id
    JOIN public.campaigns c ON c.id = o.campaign_id
    JOIN public.tester_profiles t ON t.id = jr.tester_id
    WHERE (_opportunity_id IS NULL OR jr.opportunity_id = _opportunity_id)
      AND (_status IS NULL OR jr.status = _status)
      AND (_search IS NULL OR _search = '' OR o.title ILIKE '%'||_search||'%'
           OR c.name ILIKE '%'||_search||'%' OR coalesce(t.country,'') ILIKE '%'||_search||'%')
  ), counted AS (SELECT count(*) AS n FROM rows)
  SELECT r.id, r.opportunity_id, r.o_title, r.c_name, r.c_service, r.tester_id, r.t_country,
         r.t_age, r.t_exp, r.t_avail, r.t_verif, r.t_quality, r.t_rel, r.status, r.requested_at,
         r.reviewed_at, r.rejection_reason, (SELECT n FROM counted)
  FROM rows r ORDER BY r.requested_at DESC
  LIMIT coalesce(_limit,20) OFFSET coalesce(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.admin_job_request_detail(_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.job_requests%ROWTYPE; o public.opportunities%ROWTYPE; c public.campaigns%ROWTYPE; t public.tester_profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO r FROM public.job_requests WHERE id = _request_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  SELECT * INTO o FROM public.opportunities WHERE id = r.opportunity_id;
  SELECT * INTO c FROM public.campaigns WHERE id = o.campaign_id;
  SELECT * INTO t FROM public.tester_profiles WHERE id = r.tester_id;

  RETURN jsonb_build_object(
    'id', r.id, 'status', r.status, 'requestedAt', r.requested_at, 'reviewedAt', r.reviewed_at,
    'reviewedBy', r.reviewed_by, 'rejectionReason', r.rejection_reason,
    'opportunity', jsonb_build_object('id',o.id,'title',o.title,'status',o.status,
      'slotsTotal',o.slots_total,'slotsRequested',o.slots_requested,'source',o.recruitment_source),
    'campaign', jsonb_build_object('id',c.id,'name',c.name,'serviceType',c.service_type,'productType',c.product_type),
    'tester', jsonb_build_object('id',t.id,'country',t.country,'city',t.city,'ageRange',t.age_range,
      'experienceLevel',t.experience_level,'availabilityStatus',t.availability_status,
      'verificationStatus',t.verification_status,'qualityScore',t.quality_score,
      'reliabilityScore',t.reliability_score,'completionRate',t.completion_rate,
      'completedJobs',t.completed_jobs_count),
    'devices', coalesce((SELECT jsonb_agg(jsonb_build_object('platform',d.platform,'deviceType',d.device_type,
      'model',d.model,'verificationStatus',d.verification_status)) FROM public.tester_devices d WHERE d.tester_id = t.id), '[]'::jsonb),
    'skills', coalesce((SELECT jsonb_agg(jsonb_build_object('skill',s.skill,'level',s.experience_level,
      'verificationStatus',s.verification_status)) FROM public.tester_skills s WHERE s.tester_id = t.id), '[]'::jsonb),
    'eligibility', public.tester_meets_requirements(t.id, c.id)
  );
END $$;

-- Recruitment brief for external (manual) recruitment such as Upwork.
CREATE OR REPLACE FUNCTION public.recruitment_brief(_opportunity_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o public.opportunities%ROWTYPE; c public.campaigns%ROWTYPE; brief text; r RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO o FROM public.opportunities WHERE id = _opportunity_id;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = o.campaign_id;

  brief := 'TestFlow recruitment brief' || E'\n' ||
    '===========================' || E'\n' ||
    'Role: ' || o.title || E'\n' ||
    'Service: ' || replace(c.service_type::text,'_',' ') || E'\n' ||
    'Product type: ' || coalesce(replace(c.product_type::text,'_',' '),'Not specified') || E'\n' ||
    'Testers needed: ' || o.slots_total::text || E'\n' ||
    'Applications so far: ' || o.slots_requested::text || E'\n' ||
    'Closes: ' || coalesce(to_char(o.closes_at at time zone 'UTC','YYYY-MM-DD HH24:MI') || ' UTC','Open ended') || E'\n' ||
    E'\nWhat is being tested\n' || coalesce(o.description, c.objective, 'See TestFlow for details.') || E'\n';

  brief := brief || E'\nRequirements\n';
  FOR r IN SELECT * FROM public.campaign_requirements WHERE campaign_id = c.id ORDER BY required DESC LOOP
    brief := brief || '- ' || replace(r.requirement_type,'_',' ') || ' ' ||
      lower(replace(r.operator::text,'_',' ')) || ' ' || (r.value #>> '{}') ||
      CASE WHEN r.required THEN ' (required)' ELSE ' (preferred)' END || E'\n';
  END LOOP;

  brief := brief || E'\nWhat testers will do\n';
  FOR r IN SELECT * FROM public.campaign_tasks WHERE campaign_id = c.id ORDER BY sequence LOOP
    brief := brief || '- ' || r.title ||
      CASE WHEN r.max_duration IS NOT NULL THEN ' (~' || r.max_duration || ' min)' ELSE '' END || E'\n';
  END LOOP;

  brief := brief || E'\nEvidence expected\n' ||
    coalesce(c.service_config->>'evidenceLevel','As agreed with TestFlow') || E'\n' ||
    E'\nApply through TestFlow only. TestFlow does not share client contact details, credentials or internal information.' || E'\n';

  RETURN brief;
END $$;

-- ------------------------- client visibility -------------------------
CREATE OR REPLACE FUNCTION public.campaign_recruitment_summary(_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.campaigns%ROWTYPE; res jsonb;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.is_org_member(c.organization_id) OR public.is_admin()) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT jsonb_build_object(
    'started', count(*) > 0,
    'opportunities', count(*),
    'openOpportunities', count(*) FILTER (WHERE o.status = 'OPEN'),
    'required', c.participant_target,
    'slotsTotal', coalesce(sum(o.slots_total),0),
    'requests', coalesce(sum(o.slots_requested),0),
    'filled', coalesce(sum(o.slots_filled),0),
    'status', CASE
      WHEN count(*) = 0 THEN 'NOT_STARTED'
      WHEN count(*) FILTER (WHERE o.status IN ('OPEN','PAUSED')) > 0 THEN 'RECRUITING'
      WHEN count(*) FILTER (WHERE o.status = 'FULL') > 0 THEN 'REQUESTS_RECEIVED'
      ELSE 'CLOSED' END
  ) INTO res
  FROM public.opportunities o WHERE o.campaign_id = _campaign_id;
  RETURN res;
END $$;

-- ------------------------- invitations -------------------------
CREATE OR REPLACE FUNCTION public.invitation_create(
  _email text, _campaign_id uuid DEFAULT NULL,
  _source public.recruitment_source DEFAULT 'DIRECT_INVITATION',
  _notes text DEFAULT NULL, _valid_days integer DEFAULT 14
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE raw_token text; new_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF position('@' in coalesce(_email,'')) < 2 THEN RAISE EXCEPTION 'A valid email is required'; END IF;
  raw_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.tester_invitations (email, campaign_id, invited_by, source, status, token_hash, expires_at, notes)
  VALUES (lower(btrim(_email)), _campaign_id, auth.uid(), coalesce(_source,'DIRECT_INVITATION'), 'SENT',
          encode(digest(raw_token,'sha256'),'hex'), now() + make_interval(days => greatest(coalesce(_valid_days,14),1)), _notes)
  RETURNING id INTO new_id;

  PERFORM public.record_tester_audit('INVITATION_CREATED','tester_invitation',new_id,NULL,
    jsonb_build_object('email', lower(btrim(_email)), 'source', _source, 'campaign_id', _campaign_id));
  RETURN jsonb_build_object('id', new_id, 'token', raw_token);
END $$;

CREATE OR REPLACE FUNCTION public.invitation_cancel(_invitation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE i public.tester_invitations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO i FROM public.tester_invitations WHERE id = _invitation_id FOR UPDATE;
  IF i.id IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF i.status IN ('ACCEPTED','CANCELLED') THEN RAISE EXCEPTION 'This invitation can no longer be cancelled'; END IF;
  UPDATE public.tester_invitations SET status = 'CANCELLED' WHERE id = _invitation_id;
  PERFORM public.record_tester_audit('INVITATION_CANCELLED','tester_invitation',_invitation_id,
    jsonb_build_object('status',i.status), jsonb_build_object('status','CANCELLED'));
END $$;

CREATE OR REPLACE FUNCTION public.invitation_expire_due()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  WITH upd AS (
    UPDATE public.tester_invitations SET status = 'EXPIRED'
    WHERE status IN ('PENDING','SENT') AND expires_at <= now() RETURNING id
  ) SELECT count(*) INTO n FROM upd;
  RETURN n;
END $$;

-- Accepting an invitation only links an already authenticated, onboarded
-- account to the invitation. It never grants access or skips verification.
CREATE OR REPLACE FUNCTION public.invitation_accept(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE i public.tester_invitations%ROWTYPE; uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to accept an invitation'; END IF;
  SELECT * INTO i FROM public.tester_invitations
    WHERE token_hash = encode(digest(coalesce(_token,''),'sha256'),'hex') FOR UPDATE;
  IF i.id IS NULL THEN RAISE EXCEPTION 'This invitation link is not valid'; END IF;
  IF i.status <> 'SENT' AND i.status <> 'PENDING' THEN RAISE EXCEPTION 'This invitation is no longer active'; END IF;
  IF i.expires_at <= now() THEN
    UPDATE public.tester_invitations SET status = 'EXPIRED' WHERE id = i.id;
    RAISE EXCEPTION 'This invitation has expired';
  END IF;
  IF lower(coalesce((SELECT email FROM public.profiles WHERE id = uid),'')) <> lower(i.email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  UPDATE public.tester_invitations
    SET status = 'ACCEPTED', accepted_at = now(), accepted_by = uid,
        token_hash = encode(digest(gen_random_uuid()::text || clock_timestamp()::text,'sha256'),'hex')
    WHERE id = i.id;

  PERFORM public.record_tester_audit('INVITATION_ACCEPTED','tester_invitation',i.id,
    jsonb_build_object('status',i.status), jsonb_build_object('status','ACCEPTED'));
  RETURN jsonb_build_object('accepted', true, 'campaignId', i.campaign_id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_invitations(
  _status public.invitation_status DEFAULT NULL, _search text DEFAULT NULL,
  _limit integer DEFAULT 20, _offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid, email text, status public.invitation_status, source public.recruitment_source,
  campaign_id uuid, campaign_name text, expires_at timestamptz, accepted_at timestamptz,
  created_at timestamptz, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  WITH rows AS (
    SELECT i.*, c.name AS c_name FROM public.tester_invitations i
    LEFT JOIN public.campaigns c ON c.id = i.campaign_id
    WHERE (_status IS NULL OR i.status = _status)
      AND (_search IS NULL OR _search = '' OR i.email ILIKE '%'||_search||'%')
  ), counted AS (SELECT count(*) AS n FROM rows)
  SELECT r.id, r.email, r.status, r.source, r.campaign_id, r.c_name, r.expires_at,
         r.accepted_at, r.created_at, (SELECT n FROM counted)
  FROM rows r ORDER BY r.created_at DESC
  LIMIT coalesce(_limit,20) OFFSET coalesce(_offset,0);
END $$;

-- ------------------------- execution grants -------------------------
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.current_tester_id()',
    'public.tester_meets_requirements(uuid,uuid)',
    'public.opportunity_create(uuid,text,text,integer,timestamptz,timestamptz,public.recruitment_source)',
    'public.opportunity_update_draft(uuid,text,text,integer,timestamptz,timestamptz,public.recruitment_source)',
    'public.opportunity_set_status(uuid,public.opportunity_status,text)',
    'public.opportunity_expire_due()',
    'public.tester_list_opportunities(text,public.service_type,integer,integer)',
    'public.tester_opportunity_detail(uuid)',
    'public.job_request_create(uuid)',
    'public.job_request_withdraw(uuid)',
    'public.admin_review_job_request(uuid,public.job_request_status,text)',
    'public.tester_list_requests(public.job_request_status,integer,integer)',
    'public.tester_request_counters()',
    'public.admin_recruitment_stats()',
    'public.admin_list_opportunities(text,public.opportunity_status,public.service_type,public.recruitment_source,uuid,integer,integer)',
    'public.admin_list_job_requests(uuid,public.job_request_status,text,integer,integer)',
    'public.admin_job_request_detail(uuid)',
    'public.recruitment_brief(uuid)',
    'public.campaign_recruitment_summary(uuid)',
    'public.invitation_create(text,uuid,public.recruitment_source,text,integer)',
    'public.invitation_cancel(uuid)',
    'public.invitation_expire_due()',
    'public.invitation_accept(text)',
    'public.admin_list_invitations(public.invitation_status,text,integer,integer)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.requirement_matches(public.requirement_operator,jsonb,text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.experience_rank(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.opportunity_is_requestable(public.opportunities) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requirement_matches(public.requirement_operator,jsonb,text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.experience_rank(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.opportunity_is_requestable(public.opportunities) TO authenticated;
