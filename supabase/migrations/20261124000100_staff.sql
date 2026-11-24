create table public.staff_slots (
  label text primary key check (label in ('Finance Admin', 'Finance Assistant')),
  user_id uuid unique references auth.users(id) on delete set null
);
insert into public.staff_slots(label) values ('Finance Admin'), ('Finance Assistant');
alter table public.staff_slots enable row level security;
revoke all on public.staff_slots from public, anon, authenticated;
grant select on public.staff_slots to authenticated;
create policy own_staff_assignment on public.staff_slots for select to authenticated
using (user_id = (select auth.uid()));

create table public.staff_assignment_history (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  label text not null,
  previous_user uuid,
  assigned_user uuid,
  operator_name text not null
);
alter table public.staff_assignment_history enable row level security;
revoke all on public.staff_assignment_history from public, anon, authenticated;
grant select on public.staff_assignment_history to authenticated;
create policy staff_read_history on public.staff_assignment_history for select to authenticated
using (exists (select 1 from public.staff_slots where user_id = (select auth.uid())));

create function public.log_staff_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.staff_assignment_history(label,previous_user,assigned_user,operator_name)
  values (new.label, old.user_id, new.user_id, coalesce(auth.uid()::text, session_user));
  return new;
end;
$$;
revoke all on function public.log_staff_assignment() from public, authenticated, anon;
create trigger record_assignment after update of user_id on public.staff_slots
for each row when (old.user_id is distinct from new.user_id)
execute function public.log_staff_assignment();
