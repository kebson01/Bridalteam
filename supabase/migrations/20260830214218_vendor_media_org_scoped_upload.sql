-- Scope vendor-media uploads to the vendor's own folder.
--
-- The old INSERT policy checked only bucket_id, so any signed-in account could
-- write anywhere in the bucket -- including into another vendor's folder, whose
-- files are served from public URLs on that vendor's profile. This mirrors the
-- wedding-media rule: the first path segment must be a uuid, and the caller must
-- belong to the org it names. is_org_member matches the gate /vendor already
-- applies, so no legitimate upload path changes.
drop policy if exists "vendor media upload" on storage.objects;

create policy "vendor media upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'vendor-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );
