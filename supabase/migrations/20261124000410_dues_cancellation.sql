create table public.obligation_voids(obligation_id uuid primary key references public.obligations,reason text not null check(length(trim(reason)) between 1 and 300),actor uuid not null,officer text not null,created_at timestamptz not null default now());
alter table public.obligation_voids enable row level security;
revoke all on public.obligation_voids from public,anon,authenticated;
grant select on public.obligation_voids to authenticated;
create policy staff_read on public.obligation_voids for select to authenticated using((select public.is_staff()));
create function public.cancel_obligation(target uuid,explanation text) returns void language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer();begin
 perform id from public.obligations where id=target for update;
 if exists(select from public.dues_balances where id=target and paid>0) then raise exception 'Correct linked payments first';end if;
 insert into public.obligation_voids(obligation_id,reason,actor,officer) values(target,trim(explanation),auth.uid(),staff);
end $$;
revoke all on function public.cancel_obligation(uuid,text) from public,anon;
grant execute on function public.cancel_obligation(uuid,text) to authenticated;
create or replace view public.dues_balances with(security_invoker=true) as
select o.*,coalesce(p.paid,0)::bigint paid,(o.amount-coalesce(p.paid,0))::bigint outstanding from public.obligations o left join lateral
(select sum(a.amount) paid from public.allocations a where a.obligation_id=o.id and not exists(select from public.collection_voids v where v.collection_id=a.collection_id)) p on true
where not exists(select from public.obligation_voids v where v.obligation_id=o.id);
create function public.check_open_obligation() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select from public.obligation_voids where obligation_id=new.obligation_id) then raise exception 'Obligation was cancelled';end if;
 return new;
end $$;
revoke all on function public.check_open_obligation() from public,anon,authenticated;
create trigger open_obligation before insert on public.allocations for each row when(new.obligation_id is not null) execute function public.check_open_obligation();
