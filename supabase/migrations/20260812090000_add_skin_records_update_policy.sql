-- Allow signed-in users to update only their own skin records.
revoke update on table public.skin_records from anon;
revoke update on table public.skin_records from authenticated;

grant update (
  record_date,
  overall_condition,
  redness,
  dryness,
  acne,
  oiliness,
  skincare_used,
  memo
) on public.skin_records to authenticated;

drop policy if exists "Authenticated users can update own skin records"
on public.skin_records;

create policy "Authenticated users can update own skin records"
on public.skin_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
