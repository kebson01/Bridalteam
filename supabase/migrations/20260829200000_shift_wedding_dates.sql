-- Moves every date attached to a wedding by the same number of days.
--
-- When a couple changes their wedding date, deadlines seeded from the old date
-- silently become wrong. Shifting by the same delta preserves the "X weeks
-- before the day" intent the plan was built around.
--
-- Deliberately SECURITY INVOKER: tasks and milestones already carry RLS policies
-- for editors, so permission is enforced per row by the existing rules rather
-- than by adding another SECURITY DEFINER surface. A caller without edit rights
-- simply updates nothing and gets 0 back.
create or replace function public.shift_wedding_dates(p_wedding uuid, p_days integer)
returns integer
language plpgsql
set search_path = public
as $$
declare
  moved integer := 0;
begin
  if p_wedding is null or coalesce(p_days, 0) = 0 then
    return 0;
  end if;

  update public.tasks
     set due_date = due_date + p_days
   where wedding_id = p_wedding and due_date is not null and deleted_at is null;
  get diagnostics moved = row_count;

  update public.tasks
     set start_date = start_date + p_days
   where wedding_id = p_wedding and start_date is not null and deleted_at is null;

  update public.milestones
     set target_date = target_date + p_days
   where wedding_id = p_wedding and target_date is not null;

  return moved;
end;
$$;

revoke execute on function public.shift_wedding_dates(uuid, integer) from public, anon;
grant  execute on function public.shift_wedding_dates(uuid, integer) to authenticated;
