-- Minimal security hardening of RLS helper exposure.
-- 1. Self-scoped role check so policies no longer need caller-callable has_role(_user_id, _role).
create or replace function public.self_has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = _role);
$$;

revoke all on function public.self_has_role(public.app_role) from public, anon;
grant execute on function public.self_has_role(public.app_role) to authenticated, service_role;

-- 2. Rewrite the four policies that called has_role() directly with an arbitrary user id.
drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (public.self_has_role('CLIENT') or public.is_admin());

drop policy if exists tester_profiles_insert on public.tester_profiles;
create policy tester_profiles_insert on public.tester_profiles
  for insert to authenticated
  with check (((user_id = auth.uid()) and public.self_has_role('TESTER')) or public.is_admin());

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert to authenticated
  with check (
    (public.is_org_member(organization_id) and created_by = auth.uid() and not public.self_has_role('TESTER'))
    or public.is_admin()
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and not public.self_has_role('TESTER')
    and public.can_access_conversation(conversation_id)
    and exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  );

-- 3. has_role(_user_id, _role) accepts an arbitrary user id: keep it for SECURITY DEFINER
--    internals only, remove direct caller access.
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;

-- 4. Remove blanket table privileges from the anonymous role; no policy grants anon access.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on public.%I from anon', t.tablename);
  end loop;
end $$;