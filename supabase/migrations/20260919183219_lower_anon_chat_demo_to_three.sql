-- Anonymous chat demo: 5 turns a day -> 3.
--
-- Applied to the live project 2026-09-19 as migration
-- `lower_anon_chat_demo_to_three`.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- Paired with a real call to action at the wall (components/planner-chat.tsx).
-- Until now the API said "sign up free" in bold markdown, nothing rendered it
-- as a link, and the client ignored the `limited` flag entirely — so the demo
-- limit was a dead end at the exact moment a visitor was most interested.
--
-- Three turns is enough to see the planner answer a real question and follow
-- up once, which is the whole job of a demo. It reaches the ask sooner and
-- costs less: at Claude Sonnet 5 rates a turn is about $0.011.
--
-- Deliberately still a demo, not a wall. /planner is the landing page paid
-- traffic arrives on, and putting a signup form in front of the one genuinely
-- persuasive thing on the site would mean paying for clicks that bounce at a
-- form before seeing anything work.
--
-- ── What changed ────────────────────────────────────────────────────────────
-- Only the anon chat limit. Free (200), paid (1000), generation (100, and 0
-- for anon) and every other line carry over from
-- 20260919181444_lower_free_tier_ai_chat_limit.sql unchanged.
--
-- Verified live inside a rolled-back transaction: anon chat reports limit 3,
-- anon generate 0 and denied, free chat still 200; the probe left no ai_usage
-- rows. Grants re-checked after applying — one overload, SECURITY DEFINER,
-- service_role only, anon false.

create or replace function public.consume_ai_quota(p_kind text, p_ip text, p_uid uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid     uuid := p_uid;   -- supplied by the server, not read from the JWT
  v_tier    text;
  v_subject text;
  v_limit   int;
  v_window  interval;
  v_used    int;
begin
  if p_kind not in ('chat', 'generate') then
    raise exception 'unknown quota kind' using errcode = '22023';
  end if;

  if v_uid is not null then
    v_tier := public.user_ai_tier(v_uid);
    v_subject := 'user:' || v_uid::text;
  else
    v_tier := 'anon';
    v_subject := 'ip:' || coalesce(nullif(btrim(p_ip), ''), 'unknown');
  end if;

  if v_tier = 'anon' then
    v_window := interval '1 day';
    v_limit  := case when p_kind = 'chat' then 3 else 0 end;        -- no anon generation
  elsif v_tier = 'free' then
    v_window := interval '30 days';
    v_limit  := case when p_kind = 'chat' then 200 else 100 end;
  else -- paid
    v_window := interval '30 days';
    v_limit  := case when p_kind = 'chat' then 1000 else 100 end;
  end if;

  select count(*) into v_used
  from public.ai_usage
  where subject = v_subject and kind = p_kind and created_at > now() - v_window;

  if v_used >= v_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', v_limit, 'tier', v_tier);
  end if;

  insert into public.ai_usage (subject, kind) values (v_subject, p_kind);

  delete from public.ai_usage where created_at < now() - interval '60 days';

  return jsonb_build_object('allowed', true, 'used', v_used + 1, 'limit', v_limit, 'tier', v_tier);
end;
$function$;

-- Verify:
--   begin;
--     select public.consume_ai_quota('chat', '203.0.113.9', null);  -- limit 3
--   rollback;
--
-- Rollback: re-run with 3 changed back to 5.
