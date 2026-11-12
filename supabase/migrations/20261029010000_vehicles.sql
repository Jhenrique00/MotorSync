-- Nova migração: não reaplicar a migração de identidade.
begin;
create table public.vehicles (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 150),
 price numeric(14,2) not null check (price >= 0 and price <> 'NaN'::numeric),
 created_at timestamptz not null default now()
);
create index vehicles_organization_created_idx on public.vehicles(organization_id,created_at desc);
alter table public.vehicles enable row level security;
revoke all on public.vehicles from anon,authenticated;
grant select,delete on public.vehicles to authenticated;
grant insert(organization_id,title,price),update(title,price) on public.vehicles to authenticated;
create policy vehicles_read on public.vehicles for select to authenticated using (exists(select 1 from public.organization_members m where m.organization_id=vehicles.organization_id and m.user_id=(select auth.uid())));
create policy vehicles_insert on public.vehicles for insert to authenticated with check (exists(select 1 from public.organization_members m where m.organization_id=vehicles.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller')));
create policy vehicles_update on public.vehicles for update to authenticated using (exists(select 1 from public.organization_members m where m.organization_id=vehicles.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller'))) with check (exists(select 1 from public.organization_members m where m.organization_id=vehicles.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller')));
create policy vehicles_delete on public.vehicles for delete to authenticated using (exists(select 1 from public.organization_members m where m.organization_id=vehicles.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller')));
commit;
