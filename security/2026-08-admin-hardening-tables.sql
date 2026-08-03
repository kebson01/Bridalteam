-- Security hardening (M2): backing tables for admin login rate-limiting and
-- httpOnly session cookies.
--
-- Both tables are written and read ONLY by the server via the service-role key
-- (see lib/admin-auth.ts). RLS is enabled with NO policies, so anon/authenticated
-- clients cannot read or write them at all — the service role bypasses RLS.
--
-- Additive and non-breaking: creating these tables has no effect until the
-- accompanying code (this PR) is deployed. Safe to apply ahead of the deploy.

-- Failed/successful admin credential attempts, keyed by trusted client IP, used
-- to lock out online brute-force against ADMIN_PASSWORD.
create table if not exists public.admin_login_attempts (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null,
  ok         boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists admin_login_attempts_ip_time
  on public.admin_login_attempts (ip, created_at desc);

alter table public.admin_login_attempts enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) touches it.

-- Server-set admin sessions. The cookie holds a random token; we store only its
-- SHA-256 hash, so a DB read can't reconstruct a usable cookie.
create table if not exists public.admin_sessions (
  token_hash text primary key,
  username   text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists admin_sessions_expires on public.admin_sessions (expires_at);

alter table public.admin_sessions enable row level security;
-- No policies on purpose: service-role only.

revoke all on public.admin_login_attempts from anon, authenticated;
revoke all on public.admin_sessions      from anon, authenticated;
