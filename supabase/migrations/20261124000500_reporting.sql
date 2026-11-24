create table public.church_profile(
 id boolean primary key default true check(id), name text not null check(length(trim(name)) between 1 and 150),
 address text not null default '' check(length(address)<=300), phone text not null default '' check(length(phone)<=60)
);
insert into public.church_profile(name) values ('Calvary Baptist Church');
alter table public.church_profile enable row level security;
revoke all on public.church_profile from public,anon,authenticated;
grant select,update(name,address,phone) on public.church_profile to authenticated;
create policy staff_profile on public.church_profile for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
grant insert(name),update(active) on public.payment_methods to authenticated;
create unique index method_unique_name on public.payment_methods(lower(trim(name)));
create policy staff_add_method on public.payment_methods for insert to authenticated with check((select public.is_staff()));
create policy staff_change_method on public.payment_methods for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));
create table public.settings_events(id bigint generated always as identity primary key,occurred_at timestamptz not null default now(),actor uuid not null,officer text not null,entity text not null,record_key text not null,action text not null,before_record jsonb,after_record jsonb not null);
alter table public.settings_events enable row level security;
revoke all on public.settings_events from public,anon,authenticated;
grant select on public.settings_events to authenticated;
create policy staff_settings_history on public.settings_events for select to authenticated using((select public.is_staff()));
create function public.track_setting() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.settings_events(actor,officer,entity,record_key,action,before_record,after_record) values(auth.uid(),public.current_officer(),tg_table_name,case when tg_table_name='church_profile' then 'church' else new.name end,lower(tg_op),case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));return new;end $$;
revoke all on function public.track_setting() from public,anon,authenticated;
create trigger profile_audit after update on public.church_profile for each row execute function public.track_setting();
create trigger method_audit after insert or update on public.payment_methods for each row execute function public.track_setting();
alter table public.collections add column church_name text not null default 'Calvary Baptist Church',add column church_address text not null default '',add column church_phone text not null default '';
create function public.snapshot_receipt_header() returns trigger language plpgsql set search_path='' as $$
begin select name,address,phone into strict new.church_name,new.church_address,new.church_phone from public.church_profile where id;return new;end $$;
revoke all on function public.snapshot_receipt_header() from public,anon,authenticated;
create trigger receipt_header before insert on public.collections for each row execute function public.snapshot_receipt_header();
create function public.account_roster() returns table(slot text,email text) language plpgsql stable security definer set search_path='' as $$
begin perform public.current_officer();return query select s.label,u.email::text from public.staff_slots s left join auth.users u on u.id=s.user_id order by s.label;end $$;
revoke all on function public.account_roster() from public,anon; grant execute on function public.account_roster() to authenticated;
create view public.audit_log with(security_invoker=true) as
select occurred_at,staff_label actor,entity,record_id::text record_key,action,before_record,after_record from public.directory_events
union all select occurred_at,officer,entity,record_key,action,before_record,after_record from public.settings_events
union all select created_at,officer,'contribution',c.id::text,case when replaces is null then 'post' else 'correct' end,null,to_jsonb(c)-'payload'-'request_key'||jsonb_build_object('allocations',c.payload->'lines') from public.collections c
union all select v.created_at,v.officer,'contribution',v.collection_id::text,'void',to_jsonb(c)-'payload'-'request_key',to_jsonb(v) from public.collection_voids v join public.collections c on c.id=v.collection_id
union all select created_at,officer,'expense',e.id::text,case when replaces is null then 'post' else 'correct' end,null,to_jsonb(e)-'payload'-'request_key' from public.expenses e
union all select v.created_at,v.officer,'expense',v.expense_id::text,'void',to_jsonb(e)-'payload'-'request_key',to_jsonb(v) from public.expense_voids v join public.expenses e on e.id=v.expense_id
union all select created_at,officer,'commitment',id::text,'assign',null,to_jsonb(o) from public.obligations o
union all select v.created_at,v.officer,'commitment',v.obligation_id::text,'cancel',to_jsonb(o),to_jsonb(v) from public.obligation_voids v join public.obligations o on o.id=v.obligation_id
union all select occurred_at,operator_name,'staff assignment',id::text,'assign',jsonb_build_object('user',previous_user),jsonb_build_object('user',assigned_user,'slot',label) from public.staff_assignment_history;
revoke all on public.audit_log from public,anon,authenticated;grant select on public.audit_log to authenticated;
create view public.movement_lines with(security_invoker=true) as
select c.business_date,c.currency,c.method,c.member_id,c.payer party,a.category_label category,a.category_id project_id,
 'Income' as kind,c.receipt reference,c.id record_id,a.id line_id,a.amount,c.created_at
 from public.collections c join public.allocations a on a.collection_id=c.id where not exists(select from public.collection_voids v where v.collection_id=c.id)
union all
select e.business_date,e.currency,e.method,null,e.payee,e.category,e.project_id,'Expense',e.description,e.id,e.id,e.amount,e.created_at
 from public.expenses e where not exists(select from public.expense_voids v where v.expense_id=e.id);
revoke all on public.movement_lines from public,anon,authenticated;grant select on public.movement_lines to authenticated;
create function public.finance_report(filters jsonb) returns jsonb language sql stable security invoker set search_path='' as $$
 with lines as materialized(
 select * from public.movement_lines l where
 (nullif(filters->>'from','') is null or business_date>=(filters->>'from')::date)
 and (nullif(filters->>'to','') is null or business_date<=(filters->>'to')::date)
 and (nullif(filters->>'currency','') is null or currency=filters->>'currency')
 and (nullif(filters->>'method','') is null or method=filters->>'method')
 and (nullif(filters->>'member','') is null or member_id=nullif(filters->>'member','')::uuid)
 and (nullif(filters->>'category','') is null or category=filters->>'category')
 and (nullif(filters->>'kind','') is null or kind=filters->>'kind')),
 totals as(select currency,coalesce(sum(amount) filter(where kind='Income'),0)::text income,coalesce(sum(amount) filter(where kind='Expense'),0)::text expense from lines group by currency),
 groups as(select currency,kind,category,sum(amount)::text amount from lines group by currency,kind,category),
 detail as(select * from lines order by business_date desc,created_at desc,line_id)
 select jsonb_build_object('totals',coalesce((select jsonb_agg(to_jsonb(t) order by currency) from totals t),'[]'),
 'groups',coalesce((select jsonb_agg(to_jsonb(g) order by currency,kind,category) from groups g),'[]'),
 'rows',coalesce((select jsonb_agg(to_jsonb(d)||jsonb_build_object('amount',d.amount::text) order by business_date desc,created_at desc,line_id) from detail d),'[]'))
$$;
revoke all on function public.finance_report(jsonb) from public,anon; grant execute on function public.finance_report(jsonb) to authenticated;
