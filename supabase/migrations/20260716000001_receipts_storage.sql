-- AccessRide Books — Phase 2: private storage bucket for expense receipts.
--
-- Receipts may contain card fragments and vendor account details, so the
-- bucket is private; the app serves short-lived signed URLs to admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "admin read receipts" on storage.objects;
create policy "admin read receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and public.is_admin());

drop policy if exists "admin insert receipts" on storage.objects;
create policy "admin insert receipts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and public.is_admin());

drop policy if exists "admin update receipts" on storage.objects;
create policy "admin update receipts" on storage.objects
  for update to authenticated
  using (bucket_id = 'receipts' and public.is_admin())
  with check (bucket_id = 'receipts' and public.is_admin());

drop policy if exists "admin delete receipts" on storage.objects;
create policy "admin delete receipts" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and public.is_admin());
