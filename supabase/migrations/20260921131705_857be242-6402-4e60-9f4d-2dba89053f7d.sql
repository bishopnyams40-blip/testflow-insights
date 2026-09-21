ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS service_config jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS campaigns_service_config_idx ON public.campaigns USING gin (service_config);

CREATE OR REPLACE FUNCTION public.jsonb_text_present(_cfg jsonb, _key text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT coalesce(btrim(_cfg ->> _key), '') <> '';
$$;

CREATE OR REPLACE FUNCTION public.jsonb_list_present(_cfg jsonb, _key text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_typeof(_cfg -> _key) = 'array'
     AND EXISTS (
       SELECT 1 FROM jsonb_array_elements_text(_cfg -> _key) v
       WHERE coalesce(btrim(v), '') <> ''
     );
$$;

CREATE OR REPLACE FUNCTION public.jsonb_positive_number(_cfg jsonb, _key text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE n numeric;
BEGIN
  IF _cfg -> _key IS NULL THEN RETURN false; END IF;
  BEGIN n := (_cfg ->> _key)::numeric; EXCEPTION WHEN others THEN RETURN false; END;
  RETURN n > 0;
END $$;

REVOKE EXECUTE ON FUNCTION public.jsonb_text_present(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jsonb_list_present(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jsonb_positive_number(jsonb, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.campaign_service_completeness(_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE c public.campaigns%ROWTYPE; cfg jsonb; missing text[] := '{}'; _tasks int; _no_criteria int;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.is_org_member(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  cfg := coalesce(c.service_config, '{}'::jsonb);

  IF NOT public.jsonb_text_present(cfg, 'evidenceLevel') THEN missing := missing || 'evidenceLevel'::text; END IF;
  IF NOT public.jsonb_text_present(cfg, 'urgency') THEN missing := missing || 'urgency'::text; END IF;

  IF c.service_type = 'USER_FEEDBACK' THEN
    IF NOT public.jsonb_text_present(cfg, 'targetAudience') THEN missing := missing || 'targetAudience'::text; END IF;
    IF NOT public.jsonb_list_present(cfg, 'feedbackQuestions') THEN missing := missing || 'feedbackQuestions'::text; END IF;

  ELSIF c.service_type = 'BUG_TESTING' THEN
    IF NOT public.jsonb_text_present(cfg, 'testingScope') THEN missing := missing || 'testingScope'::text; END IF;
    IF NOT public.jsonb_list_present(cfg, 'focusAreas') THEN missing := missing || 'focusAreas'::text; END IF;
    IF NOT public.jsonb_list_present(cfg, 'environments') THEN missing := missing || 'environments'::text; END IF;

  ELSIF c.service_type = 'USABILITY_TESTING' THEN
    IF NOT public.jsonb_positive_number(cfg, 'sessionDurationMinutes') THEN missing := missing || 'sessionDurationMinutes'::text; END IF;
    SELECT count(*) INTO _tasks FROM public.campaign_tasks WHERE campaign_id = _campaign_id;
    SELECT count(*) INTO _no_criteria FROM public.campaign_tasks
      WHERE campaign_id = _campaign_id AND coalesce(btrim(success_criteria), '') = '';
    IF _tasks = 0 OR _no_criteria > 0 THEN missing := missing || 'taskSuccessCriteria'::text; END IF;

  ELSIF c.service_type = 'BETA_TESTING' THEN
    IF NOT public.jsonb_positive_number(cfg, 'testingDurationDays') THEN missing := missing || 'testingDurationDays'::text; END IF;
    IF NOT public.jsonb_text_present(cfg, 'startDate') THEN missing := missing || 'startDate'::text; END IF;
    IF NOT public.jsonb_text_present(cfg, 'endDate') THEN missing := missing || 'endDate'::text; END IF;
    IF NOT public.jsonb_text_present(cfg, 'usageExpectations') THEN missing := missing || 'usageExpectations'::text; END IF;

  ELSIF c.service_type = 'TARGETED_RESEARCH' THEN
    IF NOT public.jsonb_list_present(cfg, 'researchQuestions') THEN missing := missing || 'researchQuestions'::text; END IF;
    IF NOT public.jsonb_list_present(cfg, 'screeningRequirements') THEN missing := missing || 'screeningRequirements'::text; END IF;
    IF NOT public.jsonb_text_present(cfg, 'responseFormat') THEN missing := missing || 'responseFormat'::text; END IF;
  END IF;

  RETURN jsonb_build_object('complete', array_length(missing,1) IS NULL, 'missing', to_jsonb(missing));
END $function$;

CREATE OR REPLACE FUNCTION public.campaign_submit(_campaign_id uuid)
 RETURNS campaign_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c public.campaigns%ROWTYPE; _check jsonb; _service jsonb;
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

  _service := public.campaign_service_completeness(_campaign_id);
  IF NOT (_service->>'complete')::boolean THEN
    RAISE EXCEPTION 'Service configuration is incomplete: %', _service->>'missing';
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
END $function$;

CREATE OR REPLACE FUNCTION public.audit_campaign_service_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.service_config IS DISTINCT FROM OLD.service_config
     OR NEW.service_type IS DISTINCT FROM OLD.service_type THEN
    PERFORM public.record_tester_audit('CAMPAIGN_SERVICE_CONFIG_CHANGED','campaign',NEW.id,
      jsonb_build_object('service_type', OLD.service_type, 'service_config', OLD.service_config),
      jsonb_build_object('service_type', NEW.service_type, 'service_config', NEW.service_config),
      jsonb_build_object('organization_id', NEW.organization_id));
  END IF;
  RETURN NEW;
END $function$;

REVOKE EXECUTE ON FUNCTION public.audit_campaign_service_config() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_campaign_service_config ON public.campaigns;
CREATE TRIGGER audit_campaign_service_config
AFTER UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.audit_campaign_service_config();