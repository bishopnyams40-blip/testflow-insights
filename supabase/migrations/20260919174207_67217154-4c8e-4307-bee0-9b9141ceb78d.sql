-- Internal-only helpers: no external callers at all
REVOKE ALL ON FUNCTION public.guard_tester_profile_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_tester_device_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_tester_skill_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_tester_verification_outcome() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_tester_audit(text,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_tester(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

-- Admin operations: signed-in only; each re-checks is_admin() internally
REVOKE ALL ON FUNCTION public.admin_set_tester_status(uuid, public.user_status, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_tester_availability(uuid, public.availability_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_review_device(uuid, public.attribute_verification_status, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_review_skill(uuid, public.attribute_verification_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_review_verification(uuid, public.verification_type, public.verification_status, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_testers(text, public.user_status, public.availability_status, public.verification_status, public.experience_level, text, public.device_platform, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_tester_network_stats() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_set_tester_status(uuid, public.user_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_tester_availability(uuid, public.availability_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_device(uuid, public.attribute_verification_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_skill(uuid, public.attribute_verification_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(uuid, public.verification_type, public.verification_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_testers(text, public.user_status, public.availability_status, public.verification_status, public.experience_level, text, public.device_platform, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_tester_network_stats() TO authenticated;