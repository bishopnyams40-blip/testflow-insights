
-- 1. Product type vocabulary
DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('WEBSITE','WEB_APP','MOBILE_APP','DESKTOP_APP','PROTOTYPE','CONCEPT','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Campaign columns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_type public.product_type,
  ADD COLUMN IF NOT EXISTS login_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_account_instructions text,
  ADD COLUMN IF NOT EXISTS client_notes text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_participant_target_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_participant_target_check CHECK (participant_target >= 1 AND participant_target <= 1000);

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_name_length_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_name_length_check CHECK (char_length(btrim(name)) BETWEEN 3 AND 140);

-- 3. Requirements / tasks integrity
ALTER TABLE public.campaign_requirements DROP CONSTRAINT IF EXISTS campaign_requirements_type_check;
ALTER TABLE public.campaign_requirements
  ADD CONSTRAINT campaign_requirements_type_check CHECK (requirement_type IN
    ('COUNTRY','AGE_RANGE','EXPERIENCE','SKILL','DEVICE_PLATFORM','PRIOR_EXPOSURE','AVAILABILITY','OTHER'));

ALTER TABLE public.campaign_tasks DROP CONSTRAINT IF EXISTS campaign_tasks_sequence_check;
ALTER TABLE public.campaign_tasks
  ADD CONSTRAINT campaign_tasks_sequence_check CHECK (sequence >= 1 AND sequence <= 200);

ALTER TABLE public.campaign_tasks DROP CONSTRAINT IF EXISTS campaign_tasks_title_check;
ALTER TABLE public.campaign_tasks
  ADD CONSTRAINT campaign_tasks_title_check CHECK (char_length(btrim(title)) BETWEEN 3 AND 160);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_tasks_campaign_sequence_key
  ON public.campaign_tasks (campaign_id, sequence);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS campaigns_org_status_idx ON public.campaigns (organization_id, status);
CREATE INDEX IF NOT EXISTS campaigns_org_service_idx ON public.campaigns (organization_id, service_type);
CREATE INDEX IF NOT EXISTS campaigns_org_created_idx ON public.campaigns (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_tasks_campaign_sequence_idx ON public.campaign_tasks (campaign_id, sequence);

-- 5. Campaign-manager permission (BILLING may read but not manage)
CREATE OR REPLACE FUNCTION public.can_manage_campaigns(_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = auth.uid()
      AND status = 'ACTIVE' AND role IN ('OWNER','ADMIN','MEMBER')
  );
$$;
REVOKE ALL ON FUNCTION public.can_manage_campaigns(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_campaigns(uuid) TO authenticated;

DROP POLICY IF EXISTS campaigns_insert ON public.campaigns;
CREATE POLICY campaigns_insert ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK ((public.can_manage_campaigns(organization_id) AND created_by = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS campaigns_update ON public.campaigns;
CREATE POLICY campaigns_update ON public.campaigns FOR UPDATE TO authenticated
  USING (public.can_manage_campaigns(organization_id) OR public.is_admin())
  WITH CHECK (public.can_manage_campaigns(organization_id) OR public.is_admin());

DROP POLICY IF EXISTS campaign_requirements_all ON public.campaign_requirements;
CREATE POLICY campaign_requirements_select ON public.campaign_requirements FOR SELECT TO authenticated
  USING (public.can_access_campaign(campaign_id));
CREATE POLICY campaign_requirements_write ON public.campaign_requirements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id
                 AND (public.can_manage_campaigns(c.organization_id) OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id
                 AND (public.can_manage_campaigns(c.organization_id) OR public.is_admin())));

DROP POLICY IF EXISTS campaign_tasks_all ON public.campaign_tasks;
CREATE POLICY campaign_tasks_select ON public.campaign_tasks FOR SELECT TO authenticated
  USING (public.can_access_campaign(campaign_id));
CREATE POLICY campaign_tasks_write ON public.campaign_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id
                 AND (public.can_manage_campaigns(c.organization_id) OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id
                 AND (public.can_manage_campaigns(c.organization_id) OR public.is_admin())));

-- 6. Protected campaign fields / state machine guard
CREATE OR REPLACE FUNCTION public.guard_campaign_protected_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('app.campaign_engine', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'DRAFT';
    NEW.pricing_snapshot := '{}'::jsonb;
    NEW.submitted_at := NULL; NEW.quoted_at := NULL; NEW.paid_at := NULL;
    NEW.cancelled_at := NULL; NEW.completed_at := NULL; NEW.cancellation_reason := NULL;
    RETURN NEW;
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Campaign ownership cannot be changed';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.pricing_snapshot IS DISTINCT FROM OLD.pricing_snapshot
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.quoted_at IS DISTINCT FROM OLD.quoted_at
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN
    RAISE EXCEPTION 'Campaign status and lifecycle fields can only change through TestFlow campaign actions';
  END IF;

  IF OLD.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Only draft campaigns can be edited';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_campaign_protected_fields ON public.campaigns;
CREATE TRIGGER guard_campaign_protected_fields
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_protected_fields();

-- 7. Requirements / tasks may only change while the campaign is a draft
CREATE OR REPLACE FUNCTION public.guard_campaign_child_editable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _campaign uuid; _status public.campaign_status;
BEGIN
  _campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  SELECT status INTO _status FROM public.campaigns WHERE id = _campaign;
  IF _status IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF _status <> 'DRAFT'
     AND coalesce(current_setting('app.campaign_engine', true), '') <> 'on'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Requirements and tasks can only be changed while the campaign is a draft';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_campaign_requirements_editable ON public.campaign_requirements;
CREATE TRIGGER guard_campaign_requirements_editable
  BEFORE INSERT OR UPDATE OR DELETE ON public.campaign_requirements
  FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_child_editable();

DROP TRIGGER IF EXISTS guard_campaign_tasks_editable ON public.campaign_tasks;
CREATE TRIGGER guard_campaign_tasks_editable
  BEFORE INSERT OR UPDATE OR DELETE ON public.campaign_tasks
  FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_child_editable();

-- 8. Deterministic core completeness
CREATE OR REPLACE FUNCTION public.campaign_core_completeness(_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE; missing text[] := '{}'; _tasks int;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.is_org_member(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF coalesce(btrim(c.name),'') = '' THEN missing := missing || 'name'; END IF;
  IF c.service_type IS NULL THEN missing := missing || 'service_type'; END IF;
  IF coalesce(btrim(c.objective),'') = '' THEN missing := missing || 'objective'; END IF;
  IF coalesce(btrim(c.product_name),'') = '' THEN missing := missing || 'product_name'; END IF;
  IF c.product_type IS NULL THEN missing := missing || 'product_type'; END IF;
  IF c.product_type IN ('WEBSITE','WEB_APP') AND coalesce(btrim(c.product_url),'') = '' THEN
    missing := missing || 'product_url';
  END IF;
  IF c.login_required AND coalesce(btrim(c.test_account_instructions),'') = '' THEN
    missing := missing || 'test_account_instructions';
  END IF;
  IF coalesce(c.participant_target,0) < 1 THEN missing := missing || 'participant_target'; END IF;
  IF c.deadline IS NULL THEN missing := missing || 'deadline'; END IF;
  SELECT count(*) INTO _tasks FROM public.campaign_tasks WHERE campaign_id = _campaign_id;
  IF _tasks = 0 THEN missing := missing || 'tasks'; END IF;

  RETURN jsonb_build_object('complete', array_length(missing,1) IS NULL, 'missing', to_jsonb(missing));
END $$;
REVOKE ALL ON FUNCTION public.campaign_core_completeness(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.campaign_core_completeness(uuid) TO authenticated;

-- 9. Campaign lifecycle actions
CREATE OR REPLACE FUNCTION public.campaign_submit(_campaign_id uuid)
RETURNS public.campaign_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE; _check jsonb;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.can_manage_campaigns(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF c.status <> 'DRAFT' THEN RAISE EXCEPTION 'Only draft campaigns can be submitted'; END IF;

  _check := public.campaign_core_completeness(_campaign_id);
  IF NOT (_check->>'complete')::boolean THEN
    RAISE EXCEPTION 'Campaign is incomplete: %', _check->>'missing';
  END IF;

  PERFORM set_config('app.campaign_engine','on', true);
  UPDATE public.campaigns
     SET status = 'QUOTED', submitted_at = now(), quoted_at = NULL,
         pricing_snapshot = '{}'::jsonb, updated_at = now()
   WHERE id = _campaign_id;
  PERFORM set_config('app.campaign_engine','', true);

  PERFORM public.record_tester_audit('CAMPAIGN_SUBMITTED','campaign',_campaign_id,
    jsonb_build_object('status', c.status), jsonb_build_object('status','QUOTED'),
    jsonb_build_object('organization_id', c.organization_id));
  PERFORM public.notify_tester(c.created_by,'CAMPAIGN_SUBMITTED','Campaign submitted',
    'TestFlow has received "' || c.name || '" and will prepare a quotation.');
  RETURN 'QUOTED';
END $$;
REVOKE ALL ON FUNCTION public.campaign_submit(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.campaign_submit(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.campaign_withdraw_to_draft(_campaign_id uuid)
RETURNS public.campaign_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.can_manage_campaigns(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF c.status NOT IN ('QUOTED','PAYMENT_PENDING') THEN
    RAISE EXCEPTION 'This campaign can no longer be returned to draft';
  END IF;

  PERFORM set_config('app.campaign_engine','on', true);
  UPDATE public.campaigns
     SET status = 'DRAFT', submitted_at = NULL, quoted_at = NULL,
         pricing_snapshot = '{}'::jsonb, updated_at = now()
   WHERE id = _campaign_id;
  PERFORM set_config('app.campaign_engine','', true);

  PERFORM public.record_tester_audit('CAMPAIGN_WITHDRAWN','campaign',_campaign_id,
    jsonb_build_object('status', c.status), jsonb_build_object('status','DRAFT'), '{}'::jsonb);
  RETURN 'DRAFT';
END $$;
REVOKE ALL ON FUNCTION public.campaign_withdraw_to_draft(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.campaign_withdraw_to_draft(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.campaign_cancel(_campaign_id uuid, _reason text)
RETURNS public.campaign_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.can_manage_campaigns(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF c.status IN ('CANCELLED','CLOSED','COMPLETED') THEN
    RAISE EXCEPTION 'This campaign can no longer be cancelled';
  END IF;
  IF coalesce(btrim(_reason),'') = '' THEN RAISE EXCEPTION 'A cancellation reason is required'; END IF;

  PERFORM set_config('app.campaign_engine','on', true);
  UPDATE public.campaigns
     SET status = 'CANCELLED', cancelled_at = now(), cancellation_reason = btrim(_reason), updated_at = now()
   WHERE id = _campaign_id;
  PERFORM set_config('app.campaign_engine','', true);

  PERFORM public.record_tester_audit('CAMPAIGN_CANCELLED','campaign',_campaign_id,
    jsonb_build_object('status', c.status), jsonb_build_object('status','CANCELLED'),
    jsonb_build_object('reason', btrim(_reason)));
  PERFORM public.notify_tester(c.created_by,'CAMPAIGN_CANCELLED','Campaign cancelled',
    '"' || c.name || '" has been cancelled.');
  RETURN 'CANCELLED';
END $$;
REVOKE ALL ON FUNCTION public.campaign_cancel(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.campaign_cancel(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.campaign_delete_draft(_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.can_manage_campaigns(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF c.status <> 'DRAFT' THEN RAISE EXCEPTION 'Only drafts can be deleted; cancel the campaign instead'; END IF;

  PERFORM set_config('app.campaign_engine','on', true);
  DELETE FROM public.campaign_tasks WHERE campaign_id = _campaign_id;
  DELETE FROM public.campaign_requirements WHERE campaign_id = _campaign_id;
  DELETE FROM public.campaigns WHERE id = _campaign_id;
  PERFORM set_config('app.campaign_engine','', true);

  PERFORM public.record_tester_audit('CAMPAIGN_DRAFT_DELETED','campaign',_campaign_id,
    jsonb_build_object('name', c.name, 'status', c.status), '{}'::jsonb,
    jsonb_build_object('organization_id', c.organization_id));
END $$;
REVOKE ALL ON FUNCTION public.campaign_delete_draft(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.campaign_delete_draft(uuid) TO authenticated;

-- 10. Admin operations
CREATE OR REPLACE FUNCTION public.admin_list_campaigns(
  _search text DEFAULT NULL, _status public.campaign_status DEFAULT NULL,
  _service public.service_type DEFAULT NULL, _organization_id uuid DEFAULT NULL,
  _limit int DEFAULT 20, _offset int DEFAULT 0)
RETURNS TABLE(id uuid, name text, status public.campaign_status, service_type public.service_type,
  organization_id uuid, organization_name text, created_by uuid, creator_email text,
  participant_target int, deadline timestamptz, created_at timestamptz, updated_at timestamptz,
  total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  WITH filtered AS (
    SELECT c.*, o.name AS org_name, p.email AS creator_email
    FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    LEFT JOIN public.profiles p ON p.id = c.created_by
    WHERE (_search IS NULL OR _search = '' OR c.name ILIKE '%'||_search||'%' OR o.name ILIKE '%'||_search||'%')
      AND (_status IS NULL OR c.status = _status)
      AND (_service IS NULL OR c.service_type = _service)
      AND (_organization_id IS NULL OR c.organization_id = _organization_id)
  ), counted AS (SELECT count(*) AS total FROM filtered)
  SELECT f.id, f.name, f.status, f.service_type, f.organization_id, f.org_name, f.created_by,
         f.creator_email, f.participant_target, f.deadline, f.created_at, f.updated_at, ct.total
  FROM filtered f CROSS JOIN counted ct
  ORDER BY f.created_at DESC
  LIMIT greatest(1, least(coalesce(_limit,20),100)) OFFSET greatest(0, coalesce(_offset,0));
END $$;
REVOKE ALL ON FUNCTION public.admin_list_campaigns(text, public.campaign_status, public.service_type, uuid, int, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_campaigns(text, public.campaign_status, public.service_type, uuid, int, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_campaign_stats()
RETURNS TABLE(total bigint, drafts bigint, submitted bigint, cancelled bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT count(*),
    count(*) FILTER (WHERE status = 'DRAFT'),
    count(*) FILTER (WHERE status IN ('QUOTED','PAYMENT_PENDING','PAID')),
    count(*) FILTER (WHERE status = 'CANCELLED')
  FROM public.campaigns;
END $$;
REVOKE ALL ON FUNCTION public.admin_campaign_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_campaign_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_campaign_status(_campaign_id uuid, _status public.campaign_status, _reason text DEFAULT NULL)
RETURNS public.campaign_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns%ROWTYPE; _allowed boolean := false;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;

  _allowed := (c.status = 'QUOTED' AND _status IN ('PAYMENT_PENDING','DRAFT','CANCELLED','PAUSED'))
           OR (c.status = 'PAYMENT_PENDING' AND _status IN ('PAID','QUOTED','CANCELLED','PAUSED'))
           OR (c.status = 'PAID' AND _status IN ('CANCELLED','PAUSED'))
           OR (c.status = 'PAUSED' AND _status IN ('QUOTED','PAYMENT_PENDING','PAID','CANCELLED'))
           OR (c.status = 'DRAFT' AND _status = 'CANCELLED');
  IF NOT _allowed THEN
    RAISE EXCEPTION 'Transition % -> % is not allowed', c.status, _status;
  END IF;

  PERFORM set_config('app.campaign_engine','on', true);
  UPDATE public.campaigns
     SET status = _status,
         quoted_at = CASE WHEN _status = 'PAYMENT_PENDING' THEN now() ELSE quoted_at END,
         paid_at = CASE WHEN _status = 'PAID' THEN now() ELSE paid_at END,
         cancelled_at = CASE WHEN _status = 'CANCELLED' THEN now() ELSE cancelled_at END,
         cancellation_reason = CASE WHEN _status = 'CANCELLED' THEN btrim(coalesce(_reason,'Cancelled by TestFlow')) ELSE cancellation_reason END,
         updated_at = now()
   WHERE id = _campaign_id;
  PERFORM set_config('app.campaign_engine','', true);

  PERFORM public.record_tester_audit('CAMPAIGN_STATUS_OVERRIDE','campaign',_campaign_id,
    jsonb_build_object('status', c.status), jsonb_build_object('status', _status),
    jsonb_build_object('reason', _reason));
  PERFORM public.notify_tester(c.created_by,'CAMPAIGN_STATUS_CHANGED','Campaign status updated',
    '"' || c.name || '" is now ' || _status::text || '.');
  RETURN _status;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_campaign_status(uuid, public.campaign_status, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_campaign_status(uuid, public.campaign_status, text) TO authenticated;
