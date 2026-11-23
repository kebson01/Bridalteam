-- The duplicate check for vendor leads (find_vendor_match, used by
-- import_vendor_lead) treated any shared phone number or website domain as
-- proof of the same business. Hotel chains, venue groups and caterers that run
-- several venues share both: on 2026-11-23 a 458-venue import merged 24
-- different Marriotts into one listing, 14 Hiltons into another, and copied one
-- hotel's phone onto another's listing. A name match alone was also too loose:
-- "Plantation Golf & Country Club" in Venice matched the one in Fort Myers.
--
-- New rule: two businesses are the same only when their NAMES agree, plus one
-- more thing in common: the same phone, the same website domain, or the same
-- city (or no city on one side). Names agree when their keys are equal or one
-- contains the other as whole words ("Bloom and Vine" / "Bloom and Vine
-- Florals"), with at least two words and 8 characters on the shorter side so
-- "Hilton" can't swallow every Hilton.
--
-- scripts/vendor-leads.mjs (dedupeLeads / namesAlike) mirrors this for files
-- before upload. Keep the two in step.

create or replace function public.vendor_names_alike(a text, b text)
returns boolean
language plpgsql
immutable
set search_path to 'public', 'pg_temp'
as $$
declare
  ka text := public.vendor_name_key(a);
  kb text := public.vendor_name_key(b);
  short text;
  long text;
begin
  if ka is null or kb is null then
    return false;
  end if;
  if ka = kb then
    return true;
  end if;
  if length(ka) <= length(kb) then short := ka; long := kb; else short := kb; long := ka; end if;
  return length(short) >= 8
     and position(' ' in short) > 0
     and position(' ' || short || ' ' in ' ' || long || ' ') > 0;
end;
$$;

create or replace function public.vendor_city_key(p text)
returns text
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  -- "Miami (Brickell)" -> "miami"; "Saint Augustine" and "St. Augustine" agree.
  select nullif(btrim(regexp_replace(regexp_replace(regexp_replace(
           lower(coalesce(p, '')),
           '\(.*\)', ' ', 'g'),
           '\m(st|saint)\M\.?', 'saint', 'g'),
           '[^a-z0-9]+', ' ', 'g')), '')
$$;

-- The listing a lead is the same business as, or null.
create or replace function public.find_vendor_match(
  p_name text, p_city text, p_phone text, p_website text
) returns uuid
language plpgsql stable security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_phone text := public.vendor_phone10(p_phone);
  v_domain text := public.vendor_site_domain(p_website);
  v_name text := public.vendor_name_key(p_name);
  v_city text := public.vendor_city_key(p_city);
  v_hit uuid;
  v_n int;
begin
  if v_name is null then
    return null;
  end if;

  -- Same name and the same phone or website: the strongest pair.
  if v_phone is not null or v_domain is not null then
    select org_id into v_hit from public.vendor_profiles
     where public.vendor_names_alike(business_name, p_name)
       and ((v_phone is not null and public.vendor_phone10(phone) = v_phone)
         or (v_domain is not null and public.vendor_site_domain(website) = v_domain))
     limit 1;
    if v_hit is not null then return v_hit; end if;
  end if;

  -- Same name in the same city (or a city missing on one side), and only if
  -- that's unambiguous: two different "Elegant Events" exist in Florida.
  select count(*), min(org_id::text)::uuid into v_n, v_hit
    from public.vendor_profiles
   where public.vendor_names_alike(business_name, p_name)
     and (v_city is null or public.vendor_city_key(city) is null or public.vendor_city_key(city) = v_city);
  if v_n = 1 then return v_hit; end if;

  return null;
end;
$$;

revoke all on function public.find_vendor_match(text, text, text, text) from public, anon, authenticated;
