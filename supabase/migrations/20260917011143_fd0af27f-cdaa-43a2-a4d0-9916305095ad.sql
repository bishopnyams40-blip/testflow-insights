
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_participant_boundary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_manager(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_tester_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_campaign(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_tester_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_campaign(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_conversation(uuid) TO authenticated;
