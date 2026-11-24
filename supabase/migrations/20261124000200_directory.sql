create sequence public.member_number_seq start with 1001;
create table public.members (
  id uuid primary key default gen_random_uuid(),
  member_number text not null unique default ('CBC-' || nextval('public.member_number_seq')),
  name text not null check (name = btrim(name) and length(name) between 1 and 120),
  phone text check (length(phone) between 1 and 40),
  active boolean not null default true,
  inactive_reason text,
  revision integer not null default 1,
  check ((active and inactive_reason is null) or
    (not active and inactive_reason is not null and length(btrim(inactive_reason)) between 1 and 300))
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and length(name) between 1 and 120),
  group_name text check (group_name = btrim(group_name) and length(group_name) between 1 and 80),
  active boolean not null default true,
  inactive_reason text,
  revision integer not null default 1,
  check ((active and inactive_reason is null) or
    (not active and inactive_reason is not null and length(btrim(inactive_reason)) between 1 and 300))
);
create unique index categories_unique_name on public.categories (lower(name));

insert into public.categories(name) values
('Budget Support'), ('Special Projects (Todee)'), ('Father''s Day Contribution'),
('End of Year Program'), ('IBMF T-Shirt'), ('IBMF Program Contribution'),
('Prayer Breakfast'), ('Evangelism'), ('Monthly Offering'), ('Father''s day Lappas Sale'),
('Visitation'), ('Meeting Dues'), ('Other Contribution');

create table public.directory_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor uuid not null,
  staff_label text not null,
  entity text not null,
  record_id uuid not null,
  action text not null,
  before_record jsonb,
  after_record jsonb not null
);

create function public.is_staff() returns boolean language sql stable security invoker
set search_path = '' as $$
  select exists(select 1 from public.staff_slots where user_id = (select auth.uid()));
$$;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;
alter table public.members enable row level security;
alter table public.categories enable row level security;
alter table public.directory_events enable row level security;
revoke all on public.members, public.categories, public.directory_events from public, anon, authenticated;
revoke all on sequence public.member_number_seq from public, anon, authenticated;
grant usage on sequence public.member_number_seq to authenticated;
grant select on public.members, public.categories, public.directory_events to authenticated;
grant insert(name,phone), update(name,phone,active,inactive_reason) on public.members to authenticated;
grant insert(name,group_name), update(name,group_name,active,inactive_reason) on public.categories to authenticated;
create policy staff_members on public.members for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy staff_categories on public.categories for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy staff_read_events on public.directory_events for select to authenticated using ((select public.is_staff()));

create function public.bump_directory_revision() returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

create function public.audit_directory_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare operation text := 'create';
begin
  if tg_op = 'UPDATE' then
    operation := case when new.active = old.active then 'edit'
                      when new.active then 'reactivate' else 'deactivate' end;
  end if;
  insert into public.directory_events(actor,staff_label,entity,record_id,action,before_record,after_record)
  values (auth.uid(),(select label from public.staff_slots where user_id=auth.uid()),tg_table_name,new.id,operation,
    case when tg_op = 'UPDATE' then to_jsonb(old) end,to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.bump_directory_revision(), public.audit_directory_change() from public, anon, authenticated;
create trigger members_revision before update on public.members for each row execute function public.bump_directory_revision();
create trigger categories_revision before update on public.categories for each row execute function public.bump_directory_revision();
create trigger members_audit after insert or update on public.members for each row execute function public.audit_directory_change();
create trigger categories_audit after insert or update on public.categories for each row execute function public.audit_directory_change();

create view public.active_categories with (security_invoker=true) as
select id, name, group_name, revision from public.categories where active;
revoke all on public.active_categories from public, anon, authenticated;
grant select on public.active_categories to authenticated;

create function public.find_members(term text) returns setof public.members language sql stable security invoker set search_path = '' as $$
 select m.* from public.members m where strpos(lower(m.name), lower(term)) > 0
   or strpos(lower(m.member_number), lower(term)) > 0 or strpos(coalesce(m.phone,''),term) > 0;
$$;
revoke all on function public.find_members(text) from public, anon;
grant execute on function public.find_members(text) to authenticated;
