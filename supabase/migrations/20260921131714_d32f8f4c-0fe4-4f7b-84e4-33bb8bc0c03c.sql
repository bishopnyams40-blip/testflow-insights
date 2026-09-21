REVOKE EXECUTE ON FUNCTION public.campaign_service_completeness(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campaign_service_completeness(uuid) TO authenticated;