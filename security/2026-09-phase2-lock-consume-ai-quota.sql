-- Security fix (M8 — Phase 2): close the anon-reachable AI quota RPC.
--
-- ⚠️ NOT APPLIED. ORDERING MATTERS — APPLY ONLY AFTER THE CODE CHANGE IS DEPLOYED.
--
-- ── The problem ─────────────────────────────────────────────────────────────
-- consume_ai_quota(p_kind, p_ip) reads auth.uid() to decide the caller's tier,
-- so it had to be executable by `anon`: the API routes metered through the
-- caller's own Supabase client. That made it callable directly at
-- /rest/v1/rpc/consume_ai_quota with the publishable key, and every call inserts
-- a row into ai_usage.
--
-- M3 already stopped this being a *cost* problem — clientIp() is no longer
-- forgeable, so nobody can mint themselves unlimited real chat turns. What was
-- left was an availability problem created by M3's own backstop:
-- anonChatCeilingExceeded() counts every ai_usage row with a subject like 'ip:%'
-- in the last 24h and cuts anonymous chat off above AI_ANON_DAILY_GLOBAL_CAP
-- (default 1000). Those rows don't have to come from the app. Roughly a thousand
-- scripted RPC calls — no account needed — turn the planner off for every
-- signed-out visitor for a day. The same call can also burn a chosen visitor's
-- 5-a-day bucket by passing their IP, and bloats the table.
--
-- ── Phase 1 (applied 2026-09-14, migration
--    `add_service_role_only_consume_ai_quota_with_uid`) ──────────────────────
-- Added an overload consume_ai_quota(p_kind, p_ip, p_uid) that takes the user id
-- as an argument instead of reading auth.uid(), granted to service_role ONLY.
-- lib/ai-quota.ts and both API routes (app/api/plan/route.ts,
-- app/w/[id]/generate/route.ts) now call it with supabaseAdmin(); they already
-- resolve the uid from the session and the IP from a trusted proxy hop.
--
-- ── Phase 2 (this file) ─────────────────────────────────────────────────────
-- Once that code is live, nothing calls the 2-arg version any more, so drop it.
-- Dropping rather than revoking keeps the two from drifting apart, and removes
-- consume_ai_quota from the anon SECURITY DEFINER advisory list entirely.
--
-- If you run this BEFORE the new code deploys, the currently-deployed routes
-- (which call the 2-arg version through the user's client) lose AI metering and
-- log "consume_ai_quota failed" on every request. They fail OPEN, so chat keeps
-- working un-metered rather than breaking — but that is a spend risk, not a safe
-- state. Deploy first, confirm a signed-out chat still meters (an ai_usage row
-- with subject 'ip:…' appears), then run this.

begin;

drop function if exists public.consume_ai_quota(p_kind text, p_ip text);

commit;

-- Verify — only the 3-arg overload should remain, and only for service_role:
--   select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as fn,
--          has_function_privilege('anon', p.oid, 'EXECUTE')          as anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth,
--          has_function_privilege('service_role', p.oid, 'EXECUTE')  as svc
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'consume_ai_quota';
--   -- expected: one row, consume_ai_quota(p_kind text, p_ip text, p_uid uuid)
--   --           anon=false, auth=false, svc=true
--
-- Functional re-test after applying:
--   * Signed-out visitor chats on /planner        -> metered, ai_usage 'ip:…' row
--   * Signed-out visitor exceeds 5 chats in a day -> gets the demo-limit message
--   * Signed-in couple chats                      -> metered, ai_usage 'user:…' row
--   * Signed-in couple generates a plan (/w/[id]/generate) -> metered as 'generate'
--   * POST /rest/v1/rpc/consume_ai_quota with the publishable key -> 404/permission
--     denied for both signatures
--
-- Rollback: re-create the 2-arg function from git history (it is the same body
-- with `v_uid uuid := auth.uid()`), then
--   grant execute on function public.consume_ai_quota(text, text) to anon, authenticated;
