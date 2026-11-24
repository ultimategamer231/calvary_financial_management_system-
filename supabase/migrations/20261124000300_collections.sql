create sequence public.receipt_seq;
create table public.collections (
 id uuid primary key default gen_random_uuid(), receipt text unique not null default ('CBC-'||nextval('public.receipt_seq')),
 request_key uuid unique not null, payload jsonb not null, business_date date not null,
 payer_kind text not null check(payer_kind in ('member','guest','anonymous')), member_id uuid references public.members,
 payer text not null check(length(payer) between 1 and 160), currency text not null check(currency in ('USD','LRD')),
 method text not null, reference text not null check(length(reference)<=160), notes text not null check(length(notes)<=600),
 total bigint not null check(total between 1 and 99999999999999), actor uuid not null, officer text not null,
 created_at timestamptz not null default now(), replaces uuid unique references public.collections
);
create table public.allocations (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.collections,
 category_id uuid not null references public.categories, category_label text not null,
 currency text not null check(currency in ('USD','LRD')), amount bigint not null check(amount between 1 and 99999999999999)
);
create index on public.allocations(collection_id);
create table public.collection_voids (
 collection_id uuid primary key references public.collections, reason text not null check(length(trim(reason)) between 1 and 300),
 actor uuid not null, officer text not null, created_at timestamptz not null default now()
);
create table public.payment_methods (name text primary key check(length(trim(name)) between 1 and 80), active boolean not null default true);
insert into public.payment_methods(name) values ('Cash'),('Mobile Money'),('Bank transfer');

do $$ declare t text; begin
 foreach t in array array['collections','allocations','collection_voids','payment_methods'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy staff_read on public.%I for select to authenticated using ((select public.is_staff()))',t);
 end loop;
end $$;
create function public.current_officer() returns text language plpgsql stable security definer set search_path='' as $$
declare staff text;
begin
 select label into staff from public.staff_slots where user_id=auth.uid();
 if staff is null then raise exception 'Active staff access required'; end if;
 return staff;
end $$;

create function public.void_collection(target uuid, explanation text) returns void language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer();
begin
 perform id from public.collections where id=target for update;
 insert into public.collection_voids(collection_id,reason,actor,officer) values(target,trim(explanation),auth.uid(),staff);
end $$;

create function public.post_collection(request_key_input uuid, entry jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare staff text:=public.current_officer(); existing public.collections; new_id uuid; line jsonb;
 member uuid; payer_name text; category public.categories; total_minor bigint; summed bigint:=0;
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
 if original is not null then perform public.void_collection(original,entry->>'reason'); end if;
 insert into public.collections(request_key,payload,business_date,payer_kind,member_id,payer,currency,method,reference,notes,total,actor,officer,replaces)
 values(request_key_input,entry,(entry->>'date')::date,entry->>'kind',member,payer_name,entry->>'currency',entry->>'method',
 coalesce(entry->>'reference',''),coalesce(entry->>'notes',''),total_minor,auth.uid(),staff,original) returning id into new_id;
 for line in select value from jsonb_array_elements(entry->'lines') loop
  if (line->>'amount') !~ '^[0-9]{1,14}$' then raise exception 'Invalid allocation'; end if;
  select * into strict category from public.categories where id=(line->>'category')::uuid and active for share;
  insert into public.allocations(collection_id,category_id,category_label,currency,amount)
  values(new_id,category.id,category.name,entry->>'currency',(line->>'amount')::bigint);
  summed:=summed+(line->>'amount')::bigint;
 end loop;
 if summed<>total_minor then raise exception 'Allocation total mismatch'; end if;
 return new_id;
end $$;
revoke all on function public.current_officer(),public.post_collection(uuid,jsonb),public.void_collection(uuid,text) from public,anon,authenticated;
grant execute on function public.post_collection(uuid,jsonb),public.void_collection(uuid,text) to authenticated;
