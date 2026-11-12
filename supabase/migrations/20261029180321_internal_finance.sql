-- DRAFT ONLY. Review before application. Adds internal accrual records, not bank balances.
begin;
create table public.financial_sales (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid references auth.users, organization_id uuid references public.organizations,
 source_key text not null check(length(source_key) between 8 and 100),
 description text not null check(length(btrim(description)) between 1 and 300),
 occurred_on date not null check(occurred_on between date '2000-01-01' and (now() at time zone 'America/Bahia')::date),
 revenue numeric not null check(revenue>0 and revenue<=999999999999.99 and scale(revenue)<=2),
 cost numeric check(cost>=0 and cost<=999999999999.99 and scale(cost)<=2),
 created_by uuid not null default auth.uid() references auth.users, created_at timestamptz not null default now(),
 check((owner_user_id is null)<>(organization_id is null))
);
create table public.financial_entries (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid references auth.users, organization_id uuid references public.organizations,
 source_key text not null check(length(source_key) between 8 and 100),
 kind text not null check(kind in ('income','expense')),
 description text not null check(length(btrim(description)) between 1 and 300),
 occurred_on date not null check(occurred_on between date '2000-01-01' and (now() at time zone 'America/Bahia')::date),
 amount numeric not null check(amount>0 and amount<=999999999999.99 and scale(amount)<=2),
 created_by uuid not null default auth.uid() references auth.users, created_at timestamptz not null default now(),
 check((owner_user_id is null)<>(organization_id is null))
);
create table public.financial_cancellations (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid references auth.users, organization_id uuid references public.organizations,
 sale_id uuid unique references public.financial_sales, entry_id uuid unique references public.financial_entries,
 reason text not null check(length(btrim(reason)) between 3 and 300),
 created_by uuid not null default auth.uid() references auth.users, created_at timestamptz not null default now(),
 check((sale_id is null)<>(entry_id is null)), check((owner_user_id is null)<>(organization_id is null))
);
-- Current membership checked on each operation. Finance intentionally excludes seller.
create function public.finance_access(p_owner uuid,p_org uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and ((p_owner=auth.uid() and p_org is null) or (p_owner is null and exists(select 1 from public.organization_members m where m.organization_id=p_org and m.user_id=auth.uid() and m.role in ('owner','manager'))))
$$;
revoke all on function public.finance_access(uuid,uuid) from public;
grant execute on function public.finance_access(uuid,uuid) to authenticated;
create function public.validate_financial_cancellation() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.sale_id is not null and not exists(select 1 from public.financial_sales s where s.id=new.sale_id and s.owner_user_id is not distinct from new.owner_user_id and s.organization_id is not distinct from new.organization_id) then raise exception 'Venda fora deste controle financeiro';end if;
 if new.entry_id is not null and not exists(select 1 from public.financial_entries e where e.id=new.entry_id and e.owner_user_id is not distinct from new.owner_user_id and e.organization_id is not distinct from new.organization_id) then raise exception 'Lançamento fora deste controle financeiro';end if;
 return new;
end $$;
revoke all on function public.validate_financial_cancellation() from public,anon,authenticated;
create trigger validate_financial_cancellation before insert on public.financial_cancellations for each row execute function public.validate_financial_cancellation();
do $$ declare t text;begin
 foreach t in array array['financial_sales','financial_entries','financial_cancellations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy finance_read on public.%I for select to authenticated using(public.finance_access(owner_user_id,organization_id))',t);
 execute format('create policy finance_insert on public.%I for insert to authenticated with check(public.finance_access(owner_user_id,organization_id) and created_by=(select auth.uid()))',t);
 end loop;
end $$;
grant insert(owner_user_id,organization_id,source_key,description,occurred_on,revenue,cost) on public.financial_sales to authenticated;
grant insert(owner_user_id,organization_id,source_key,kind,description,occurred_on,amount) on public.financial_entries to authenticated;
grant insert(owner_user_id,organization_id,sale_id,entry_id,reason) on public.financial_cancellations to authenticated;
-- No UPDATE/DELETE grants: corrections preserve originals through cancellation records.
create unique index financial_sales_person_key on public.financial_sales(owner_user_id,source_key) where owner_user_id is not null;
create unique index financial_sales_org_key on public.financial_sales(organization_id,source_key) where organization_id is not null;
create unique index financial_entries_person_key on public.financial_entries(owner_user_id,source_key) where owner_user_id is not null;
create unique index financial_entries_org_key on public.financial_entries(organization_id,source_key) where organization_id is not null;
create index financial_sales_person_date on public.financial_sales(owner_user_id,occurred_on);
create index financial_sales_org_date on public.financial_sales(organization_id,occurred_on);
create index financial_entries_person_date on public.financial_entries(owner_user_id,occurred_on);
create index financial_entries_org_date on public.financial_entries(organization_id,occurred_on);
create index financial_cancel_person on public.financial_cancellations(owner_user_id);
create index financial_cancel_org on public.financial_cancellations(organization_id);
create function public.finance_report(p_from date,p_to date,p_org uuid default null,p_kind text default '',p_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;begin
 if not coalesce(public.finance_access(case when p_org is null then auth.uid() else null end,p_org),false) then raise exception 'Sem permissão para este financeiro' using errcode='42501';end if;
 if p_from is null or p_to is null or p_from>p_to or p_to-p_from>366 or p_kind not in ('','sale','income','expense') or p_offset<0 or p_offset>100000 then raise exception 'Período ou tipo inválido';end if;
 with all_records as (
 select s.id,s.description,s.occurred_on,'sale'::text kind,s.revenue amount,s.cost,s.created_at,s.created_by,c.id cancellation_id,c.reason cancellation_reason from public.financial_sales s left join public.financial_cancellations c on c.sale_id=s.id
 where (p_org is null and s.owner_user_id=auth.uid() and s.organization_id is null) or (p_org is not null and s.organization_id=p_org)
 union all
 select e.id,e.description,e.occurred_on,e.kind,e.amount,null::numeric,e.created_at,e.created_by,c.id,c.reason from public.financial_entries e left join public.financial_cancellations c on c.entry_id=e.id
 where (p_org is null and e.owner_user_id=auth.uid() and e.organization_id is null) or (p_org is not null and e.organization_id=p_org)
 ), period_records as (select * from all_records where occurred_on between p_from and p_to),
 active_records as(select * from period_records where cancellation_id is null),
 totals as(select count(*) n,count(*) filter(where kind='sale') sales,count(*) filter(where kind='sale' and cost is null) missing_cost,
 coalesce(sum(amount) filter(where kind='sale'),0) revenue,coalesce(sum(cost) filter(where kind='sale'),0) cost,
 coalesce(sum(amount) filter(where kind='income'),0) income,coalesce(sum(amount) filter(where kind='expense'),0) expenses from active_records),
 buckets as(select date_trunc(case when p_to-p_from>90 then 'month' else 'day' end,occurred_on)::date as bucket_date,
 sum(case when kind='sale' then amount else 0 end) revenue,sum(coalesce(cost,0)) cost,
 sum(case when kind='income' then amount else 0 end) income,sum(case when kind='expense' then amount else 0 end) expenses,
 count(*) filter(where kind='sale' and cost is null) missing_cost from active_records group by 1)
 select jsonb_build_object('summary',(select to_jsonb(t)||jsonb_build_object('gross',case when sales>0 and missing_cost=0 then revenue-cost end,'result',case when n>0 and missing_cost=0 then revenue+income-cost-expenses end) from totals t),
 'first_date',(select min(occurred_on) from all_records),
 'count',(select count(*) from period_records where p_kind='' or kind=p_kind),
 'rows',coalesce((select jsonb_agg(to_jsonb(r)) from(select * from period_records where p_kind='' or kind=p_kind order by occurred_on desc,created_at desc,id offset p_offset limit 20)r),'[]'),
 'buckets',coalesce((select jsonb_agg((to_jsonb(b)-'bucket_date')||jsonb_build_object('day',b.bucket_date) order by b.bucket_date) from buckets b),'[]')) into result;
 return result;
end $$;
revoke all on function public.finance_report(date,date,uuid,text,integer) from public;
grant execute on function public.finance_report(date,date,uuid,text,integer) to authenticated;
commit;

