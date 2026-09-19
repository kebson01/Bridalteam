-- Lower the free tier's AI chat ceiling from 1000 to 200 per 30 days.
--
-- Applied to the live project 2026-09-19 as migration
-- `lower_free_tier_ai_chat_limit`.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- At Claude Sonnet 5 pricing ($2/MTok in, $10/MTok out) a chat turn costs
-- roughly $0.011: a ~2.4k-token system prompt plus up to 12 turns of history
-- in, up to 1024 tokens out. The old ceiling therefore let one free account
-- spend about $11 a month, and couples are free — so that is $11 against no
-- revenue, per account, with nothing in the product to slow it down.
--
-- A real couple runs 20–50 chats across an entire engagement. 200 per 30 days
-- is still six a day and far beyond genuine use, while capping the worst case
-- at about $2.20.
--
-- ── What changed, and what deliberately did not ─────────────────────────────
-- Only the two limit expressions. Tier resolution, subject derivation, the
-- ai_usage insert and the 60-day cleanup are byte-identical to the previous
-- definition.
--
--   free chat      1000 -> 200
--   paid chat      1000 (unchanged)
--   free/paid gen  100  (unchanged)
--   anon chat      5/day (unchanged)
--
-- Paid keeps 1000 because free and paid held the same limits before, which
-- meant the paid tier bought nothing here. Generation is untouched: it is the
-- feature people actually pay for, and nobody runs it in a loop by accident.
--
-- `create or replace` preserves the existing grants — verified after applying
-- that this is still SECURITY DEFINER, still the only overload, and still
-- executable by service_role alone (anon and authenticated both false), so M8
-- phase 2 is not undone.
--
-- Verified live inside a rolled-back transaction: free chat reports limit 200,
-- free generate 100, anon chat 5, and no ai_usage rows survived the probe.
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
    v_limit  := case when p_kind = 'chat' then 5 else 0 end;        -- no anon generation
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
--   select public.consume_ai_quota('chat', null, gen_random_uuid());
--   -- expect {"tier":"free","limit":200,...}; wrap in begin/rollback so the
--   -- probe leaves no ai_usage row behind.
--
-- Rollback: re-run this file with 200 changed back to 1000.
