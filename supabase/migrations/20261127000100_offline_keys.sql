-- A returning staff member can recover encrypted outbox records on this browser.
create schema if not exists private;
create table private.offline_keys (
  owner uuid primary key references auth.users(id) on delete cascade,
  secret uuid not null default gen_random_uuid(),
  second_secret uuid not null default gen_random_uuid()
);
revoke all on private.offline_keys from public, anon, authenticated;

create function public.offline_storage_key() returns text
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  perform public.current_officer();
  insert into private.offline_keys(owner) values(owner_id) on conflict do nothing;
  return (select replace(secret::text || second_secret::text, '-', '')
          from private.offline_keys where owner = owner_id);
end $$;
revoke all on function public.offline_storage_key() from public, anon;
grant execute on function public.offline_storage_key() to authenticated;
