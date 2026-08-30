-- Match vendor-media deletes to the upload rule.
--
-- The old policy was owner = auth.uid(): only the individual who uploaded a file
-- could remove it. On a vendor account with more than one person that is wrong in
-- both directions -- a colleague cannot take down a bad photo, while someone who
-- has since left the org keeps the right to delete its media. Scoping to current
-- org membership fixes both, and matches "vendor media upload".
drop policy if exists "vendor media delete own" on storage.objects;

create policy "vendor media delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'vendor-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );
