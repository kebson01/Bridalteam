-- Security fix (M7): stop `anon` executing RPCs only signed-in users ever call.
--
-- Applied to the live DB 2026-09-14 as migration
-- `revoke_anon_execute_on_signed_in_only_rpcs`.
--
-- The audit logged 56 SECURITY DEFINER advisories as expected noise, since every
-- one of these functions authorizes internally (auth.uid(), is_org_admin,
-- can_edit_wedding, …). That stays true — this is defence in depth, not a fix
-- for a live hole: it removes the ability to *reach* them signed-out at all, so
-- a future editing mistake inside one of them isn't exposed to the internet.
--
-- ── Which functions, and why only these ─────────────────────────────────────
-- Each function below is reached through a server action that returns early
-- unless auth.getUser() yields a user, so `anon` never legitimately calls it.
--
-- Deliberately NOT touched:
--   * The 13 predicates used inside RLS policies — can_edit_wedding,
--     can_access_wedding, is_org_member, can_manage_wedding, can_see_post,
--     is_group_member, is_org_admin, is_public_post, owns_space,
--     can_access_task, can_edit_task, space_is_public and
--     vendor_accepts_inquiries. Policy expressions are evaluated as the calling
--     role, so revoking these from `anon` breaks every public read: the
--     community feed, published vendor profiles, public wedding pages.
--   * The genuinely public RPCs — get_public_wedding, list_public_registry,
--     get_guest_invite, submit_guest_rsvp (a signed-out guest submits their own
--     RSVP straight from the browser) and consume_ai_quota (the planner meters
--     anonymous chat through the caller's own client).
--
-- ⚠️ EXECUTE on most of these came from PUBLIC (`=X/postgres` in proacl), not
-- from a grant to `anon`, so `revoke ... from anon` alone is a NO-OP. Revoke
-- from both. `authenticated`, `service_role` and `postgres` hold explicit grants
-- and keep working. submit_guest_rsvp already had PUBLIC revoked, and is the
-- pattern this follows.

begin;

revoke execute on function public.add_group_members_by_email(uuid, text[]) from public, anon;
revoke execute on function public.is_group_owner(uuid)                     from public, anon;
revoke execute on function public.join_public_group(uuid)                  from public, anon;
revoke execute on function public.list_group_members(uuid)                 from public, anon;
revoke execute on function public.list_suggested_groups(integer)           from public, anon;
revoke execute on function public.remove_group_member(uuid, uuid)          from public, anon;
revoke execute on function public.set_wedding_website(uuid, boolean, text, text) from public, anon;

commit;

-- Verify — all seven must read anon=false, auth=true, svc=true:
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE')          as anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth,
--          has_function_privilege('service_role', p.oid, 'EXECUTE')  as svc
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname in (
--     'add_group_members_by_email','is_group_owner','join_public_group',
--     'list_group_members','list_suggested_groups','remove_group_member',
--     'set_wedding_website');
--
-- Verified post-apply by impersonating the role (`set local role anon`): all
-- seven denied, while get_public_wedding, list_public_registry,
-- get_guest_invite, consume_ai_quota and anon SELECTs on vendor_profiles, posts
-- and post_groups all still succeed. The advisor count for
-- anon_security_definer_function_executable fell 25 -> 18; the 18 remaining are
-- the 13 policy predicates plus the 5 public RPCs listed above.
--
-- Rollback, if one of these ever needs to be reachable signed-out again:
--   grant execute on function public.<fn>(<args>) to anon;
