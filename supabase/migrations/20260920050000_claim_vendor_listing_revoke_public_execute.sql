-- Follow-up to 20260920040000. Applied separately to the live DB, and kept as
-- its own migration rather than folded into that file, so the history shows
-- the window in which the function was anon-reachable.
--
-- `revoke execute ... from anon` was a no-op: EXECUTE on a new function is
-- granted to PUBLIC, which anon inherits, so revoking from the role by name
-- removes a grant that was never there. This is the exact trap the closing
-- note of SECURITY-AUDIT-MAIN.md warns about.
--
-- Not exploitable as it stood -- claim_vendor_listing raises 'Not signed in'
-- when auth.uid() is null -- but an anon-reachable SECURITY DEFINER function
-- is an advisor warning and one authorization bug away from mattering.
--
-- get_claim_preview keeps its PUBLIC grant deliberately: the outreach link is
-- opened before anyone signs in, and the unguessable token is the credential.

revoke execute on function public.claim_vendor_listing(text) from public;
grant execute on function public.claim_vendor_listing(text) to authenticated;
