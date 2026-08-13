-- Allow signed-in users to delete only their own skin records.
do $$
declare
  unexpected_policy_names text;
begin
  select string_agg(policyname, ', ' order by policyname)
  into unexpected_policy_names
  from pg_policies
  where schemaname = 'public'
    and tablename = 'skin_records'
    and cmd = 'DELETE'
    and policyname <> 'Authenticated users can delete own skin records';

  if unexpected_policy_names is not null then
    raise exception
      'Unexpected DELETE policies exist on public.skin_records: %. Review them before applying this migration.',
      unexpected_policy_names;
  end if;
end $$;

revoke delete on table public.skin_records from anon;
revoke delete on table public.skin_records from authenticated;

grant delete on table public.skin_records to authenticated;

drop policy if exists "Authenticated users can delete own skin records"
on public.skin_records;

create policy "Authenticated users can delete own skin records"
on public.skin_records
for delete
to authenticated
using (auth.uid() = user_id);
