-- =========================================================================
-- ACAT CyberGuard — Storage bucket + policies for evidence files
-- Run this once. If you already created an 'evidence' bucket by hand in
-- the Dashboard, skip the insert below and just run the two policies.
-- Path convention used by the app: {user_id}/{incident_id}/{random}.{ext}
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Owners can upload/read/delete only inside their own {user_id}/... folder.
create policy "evidence_bucket_owner_rw" on storage.objects
  for all
  using (bucket_id = 'evidence' and (auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'evidence' and (auth.uid())::text = (storage.foldername(name))[1]);

-- Staff (see staff_roles table) can read any file in the bucket to review evidence.
create policy "evidence_bucket_staff_read" on storage.objects
  for select
  using (bucket_id = 'evidence' and is_staff());
