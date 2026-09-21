CREATE OR REPLACE FUNCTION public.campaign_core_completeness(_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c public.campaigns%ROWTYPE; missing text[] := '{}'; _tasks int;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF NOT (public.is_org_member(c.organization_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF coalesce(btrim(c.name),'') = '' THEN missing := missing || 'name'::text; END IF;
  IF c.service_type IS NULL THEN missing := missing || 'service_type'::text; END IF;
  IF coalesce(btrim(c.objective),'') = '' THEN missing := missing || 'objective'::text; END IF;
  IF coalesce(btrim(c.product_name),'') = '' THEN missing := missing || 'product_name'::text; END IF;
  IF c.product_type IS NULL THEN missing := missing || 'product_type'::text; END IF;
  IF c.product_type IN ('WEBSITE','WEB_APP') AND coalesce(btrim(c.product_url),'') = '' THEN
    missing := missing || 'product_url'::text;
  END IF;
  IF c.login_required AND coalesce(btrim(c.test_account_instructions),'') = '' THEN
    missing := missing || 'test_account_instructions'::text;
  END IF;
  IF coalesce(c.participant_target,0) < 1 THEN missing := missing || 'participant_target'::text; END IF;
  IF c.deadline IS NULL THEN missing := missing || 'deadline'::text; END IF;
  SELECT count(*) INTO _tasks FROM public.campaign_tasks WHERE campaign_id = _campaign_id;
  IF _tasks = 0 THEN missing := missing || 'tasks'::text; END IF;

  RETURN jsonb_build_object('complete', array_length(missing,1) IS NULL, 'missing', to_jsonb(missing));
END $function$;