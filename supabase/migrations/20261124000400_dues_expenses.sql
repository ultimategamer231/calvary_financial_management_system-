create table public.obligations (
 id uuid primary key default gen_random_uuid(), batch uuid not null, member_id uuid not null references public.members,
 category_id uuid not null references public.categories, category_label text not null, member_name text not null,
 group_label text not null default '' check(length(group_label)<=100), due_date date not null,
 currency text not null check(currency in ('USD','LRD')), amount bigint not null check(amount between 1 and 99999999999999),
 actor uuid not null, officer text not null, created_at timestamptz not null default now(), unique(batch,member_id)
);
alter table public.allocations add column obligation_id uuid references public.obligations;
create index on public.allocations(obligation_id) where obligation_id is not null;
alter table public.obligations enable row level security;
revoke all on public.obligations from public,anon,authenticated;
grant select on public.obligations to authenticated;
create policy staff_read on public.obligations for select to authenticated using ((select public.is_staff()));
create view public.dues_balances with (security_invoker=true) as
select o.*, coalesce(p.paid,0)::bigint paid,(o.amount-coalesce(p.paid,0))::bigint outstanding
from public.obligations o left join lateral (
 select sum(a.amount) paid from public.allocations a where a.obligation_id=o.id
 and not exists(select from public.collection_voids v where v.collection_id=a.collection_id)
) p on true;
revoke all on public.dues_balances from public,anon,authenticated;
grant select on public.dues_balances to authenticated;
create function public.assign_dues(batch_key uuid,entry jsonb) returns void language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer(); cat public.categories; m public.members; mid text;
begin
 if jsonb_typeof(entry->'members') is distinct from 'array' or jsonb_array_length(entry->'members') not between 1 and 1000 then raise exception 'Choose members';end if;
 if (entry->>'amount') !~ '^[0-9]{1,14}$' then raise exception 'Invalid amount';end if;
 select * into strict cat from public.categories where active and id=(entry->>'category')::uuid for share;
 for mid in select value from jsonb_array_elements_text(entry->'members') order by value loop
 select * into strict m from public.members where active and id=mid::uuid for share;
 insert into public.obligations(batch,member_id,category_id,category_label,member_name,group_label,due_date,currency,amount,actor,officer)
 values(batch_key,m.id,cat.id,cat.name,m.name,coalesce(entry->>'group',''),(entry->>'date')::date,entry->>'currency',(entry->>'amount')::bigint,auth.uid(),staff);
 end loop;
end $$;
revoke all on function public.assign_dues(uuid,jsonb) from public,anon;
grant execute on function public.assign_dues(uuid,jsonb) to authenticated;
create or replace function public.post_collection(request_key_input uuid, entry jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer(); existing public.collections; new_id uuid; line jsonb;
 member uuid; payer_name text; category public.categories; total_minor bigint; summed bigint:=0;
 due public.obligations; paid bigint;
 original uuid:=nullif(entry->>'replaces','')::uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(request_key_input::text,0));
 select * into existing from public.collections where request_key=request_key_input;
 if found then
  if existing.actor<>auth.uid() or existing.payload<>entry then raise exception 'Submission key already used'; end if;
  return existing.id;
 end if;
 if jsonb_typeof(entry->'lines') is distinct from 'array' or jsonb_array_length(entry->'lines') not between 1 and 50 then raise exception 'Enter 1 to 50 allocations'; end if;
 if (entry->>'total') !~ '^[0-9]{1,14}$' then raise exception 'Invalid total'; end if;
 total_minor:=(entry->>'total')::bigint;
 perform name from public.payment_methods where active and name=entry->>'method' for share;
 if not found then raise exception 'Select an active payment method'; end if;
 case entry->>'kind'
 when 'member' then
  member:=(entry->>'member')::uuid;
  select name into payer_name from public.members where id=member and active for share;
 when 'guest' then payer_name:=trim(entry->>'guest');
 when 'anonymous' then payer_name:='Anonymous';
 else raise exception 'Invalid contributor type';
 end case;
 perform id from public.obligations where id in(select nullif(x->>'obligation','')::uuid from jsonb_array_elements(entry->'lines') x) order by id for update;
 if original is not null then perform public.void_collection(original,entry->>'reason'); end if;
 insert into public.collections(request_key,payload,business_date,payer_kind,member_id,payer,currency,method,reference,notes,total,actor,officer,replaces)
 values(request_key_input,entry,(entry->>'date')::date,entry->>'kind',member,payer_name,entry->>'currency',entry->>'method',
 coalesce(entry->>'reference',''),coalesce(entry->>'notes',''),total_minor,auth.uid(),staff,original) returning id into new_id;
 for line in select value from jsonb_array_elements(entry->'lines') loop
  if (line->>'amount') !~ '^[0-9]{1,14}$' then raise exception 'Invalid allocation'; end if;
  select * into strict category from public.categories where id=(line->>'category')::uuid and active for share;
  if nullif(line->>'obligation','') is not null then
   select * into strict due from public.obligations where id=(line->>'obligation')::uuid;
   if member is distinct from due.member_id or category.id<>due.category_id or entry->>'currency'<>due.currency then raise exception 'Obligation does not match allocation';end if;
   select coalesce(sum(a.amount),0) into paid from public.allocations a where a.obligation_id=due.id and not exists(select from public.collection_voids v where v.collection_id=a.collection_id);
   if paid+(line->>'amount')::bigint>due.amount then raise exception 'Amount exceeds outstanding obligation';end if;
  end if;
  insert into public.allocations(collection_id,category_id,category_label,currency,amount,obligation_id)
  values(new_id,category.id,category.name,entry->>'currency',(line->>'amount')::bigint,nullif(line->>'obligation','')::uuid);
  summed:=summed+(line->>'amount')::bigint;
 end loop;
 if summed<>total_minor then raise exception 'Allocation total mismatch'; end if;
 return new_id;
end $$;

create table public.expenses (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique, payload jsonb not null,
 business_date date not null, currency text not null check(currency in ('USD','LRD')),
 amount bigint not null check(amount between 1 and 99999999999999), method text not null, payee text not null check(length(trim(payee)) between 1 and 160),
 category text not null check(length(trim(category)) between 1 and 120), description text not null check(length(trim(description)) between 1 and 600),
 project_id uuid references public.categories, project_label text, actor uuid not null, officer text not null, created_at timestamptz not null default now(),
 replaces uuid unique references public.expenses
);
create table public.expense_voids (expense_id uuid primary key references public.expenses,reason text not null check(length(trim(reason)) between 1 and 300),
actor uuid not null,officer text not null,created_at timestamptz not null default now());
do $$ declare t text;begin foreach t in array array['expenses','expense_voids'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy staff_read on public.%I for select to authenticated using ((select public.is_staff()))',t);
end loop;end $$;
create function public.void_expense(target uuid,explanation text) returns void language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer();begin
 perform id from public.expenses where id=target for update;
 insert into public.expense_voids(expense_id,reason,actor,officer) values(target,trim(explanation),auth.uid(),staff);
end $$;
create function public.post_expense(request_key_input uuid,entry jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer(); existing public.expenses; original uuid:=nullif(entry->>'replaces','')::uuid;
 project uuid:=nullif(entry->>'project','')::uuid; label text;new_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(request_key_input::text,2)); select * into existing from public.expenses where request_key=request_key_input;
 if found then if existing.payload<>entry or existing.actor<>auth.uid() then raise exception 'Submission key already used';end if;return existing.id;end if;
 if (entry->>'amount') !~ '^[0-9]{1,14}$' then raise exception 'Invalid amount';end if;
 perform name from public.payment_methods where active and name=entry->>'method' for share;if not found then raise exception 'Choose an active method';end if;
 if project is not null then select name into strict label from public.categories where active and id=project for share;end if;
 if original is not null then perform public.void_expense(original,entry->>'reason');end if;
 insert into public.expenses(request_key,payload,business_date,currency,amount,method,payee,category,description,project_id,project_label,actor,officer,replaces)
 values(request_key_input,entry,(entry->>'date')::date,entry->>'currency',(entry->>'amount')::bigint,entry->>'method',trim(entry->>'payee'),trim(entry->>'category'),trim(entry->>'description'),project,label,auth.uid(),staff,original)
 returning id into new_id;return new_id;
end $$;
revoke all on function public.post_expense(uuid,jsonb),public.void_expense(uuid,text) from public,anon;
grant execute on function public.post_expense(uuid,jsonb),public.void_expense(uuid,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('expense-evidence','expense-evidence',false,2097152,array['application/pdf','image/png','image/jpeg']);
create policy expense_evidence_read on storage.objects for select to authenticated using(bucket_id='expense-evidence' and (select public.is_staff()));
create policy expense_evidence_add on storage.objects for insert to authenticated with check(bucket_id='expense-evidence' and (select public.is_staff()) and exists(select 1 from public.expenses e where e.id::text=(storage.foldername(name))[1]) and split_part(storage.filename(name),'~',1)=auth.uid()::text);
