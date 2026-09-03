alter table public.skin_records
  add column if not exists photo_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'skin_records_photo_path_user_folder_check'
      and conrelid = 'public.skin_records'::regclass
  ) then
    alter table public.skin_records
      add constraint skin_records_photo_path_user_folder_check
      check (
        photo_path is null
        or split_part(photo_path, '/', 1) = user_id::text
      );
  end if;
end $$;

revoke select (photo_path), insert (photo_path), update (photo_path)
on table public.skin_records
from anon;

grant select (photo_path), insert (photo_path), update (photo_path)
on table public.skin_records
to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'skin-record-photos',
  'skin-record-photos',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Skin record photo owners can view photos"
on storage.objects;

create policy "Skin record photo owners can view photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'skin-record-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Skin record photo owners can upload photos"
on storage.objects;

create policy "Skin record photo owners can upload photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'skin-record-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Skin record photo owners can delete photos"
on storage.objects;

create policy "Skin record photo owners can delete photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'skin-record-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
