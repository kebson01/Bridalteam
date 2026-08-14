-- Self-serve account deletion, "remove the member, keep the shared plan".
--
-- Applied to project yubcwyfhgxjnqydhgjit via apply_migration (this repo does
-- not run the Supabase CLI; the file is kept for review/version control).
--
-- _delete_account_data(target) reconciles the user's data and then deletes the
-- auth.users row in the SAME transaction, so the operation is atomic — there is
-- no window where the app rows are gone but the login still works. It is NOT
-- granted to clients (it takes an arbitrary uuid). The public wrapper
-- delete_my_account() derives the uid from the JWT so a caller can only ever
-- delete their own account.
--
-- After auth.users is deleted, the FK ON DELETE rules finish the job:
--   CASCADE  — org_members, wedding_members, and personal community rows
--   SET NULL — weddings.owner_user_id, tasks.created_by/assigned_to,
--              task_notes.author_id, saved_inspiration.saved_by, …
-- so shared weddings and their tasks/notes survive with the person removed.

create or replace function public._delete_account_data(target uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  w record;
  next_owner uuid;
begin
  if target is null then
    raise exception 'target required';
  end if;

  -- Guard: never strand a paying vendor org. If the user is the SOLE member of
  -- a vendor org with a live subscription, refuse until billing is cancelled.
  if exists (
    select 1 from organizations o
    where o.type = 'vendor'
      and o.subscription_status = 'active'
      and exists (select 1 from org_members m where m.org_id = o.id and m.user_id = target)
      and not exists (select 1 from org_members m where m.org_id = o.id and m.user_id <> target)
  ) then
    raise exception 'active_vendor_subscription';
  end if;

  -- Weddings this user OWNS: hand off to another member when the plan is shared,
  -- otherwise delete the solo plan (all children cascade off weddings).
  for w in select id, org_id from weddings where owner_user_id = target loop
    next_owner := coalesce(
      (select wm.user_id from wedding_members wm
        where wm.wedding_id = w.id and wm.user_id <> target
        order by case when wm.role in ('couple','partner','planner') then 0 else 1 end
        limit 1),
      (select m.user_id from org_members m
        where m.org_id = w.org_id and m.user_id <> target
        order by case when m.role in ('owner','admin') then 0 else 1 end
        limit 1)
    );

    if next_owner is not null then
      update weddings set owner_user_id = next_owner where id = w.id;
    else
      delete from weddings where id = w.id;
    end if;
  end loop;

  -- Remove couple orgs the user solely owns that no longer hold any wedding.
  -- (weddings.org_id is RESTRICT, so an org still holding a handed-off wedding
  -- is intentionally left in place; it just becomes memberless.)
  delete from organizations o
  where o.type = 'couple'
    and exists (select 1 from org_members m where m.org_id = o.id and m.user_id = target)
    and not exists (select 1 from org_members m where m.org_id = o.id and m.user_id <> target)
    and not exists (select 1 from weddings x where x.org_id = o.id);

  -- Finally remove the account. Cascades memberships and personal community
  -- rows; nulls out authorship on shared content.
  delete from auth.users where id = target;
end;
$$;

revoke all on function public._delete_account_data(uuid) from public, anon, authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  perform public._delete_account_data(auth.uid());
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
