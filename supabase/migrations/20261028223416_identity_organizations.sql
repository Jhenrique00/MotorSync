begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100)
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150)
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','seller')),
  primary key (organization_id,user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
revoke all on public.profiles,public.organizations,public.organization_members from anon,authenticated;
grant select on public.profiles,public.organizations,public.organization_members to authenticated;
grant insert (id,display_name), update (display_name) on public.profiles to authenticated;
create policy profile_read_self on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profile_create_self on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy profile_update_self on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy membership_read_self on public.organization_members for select to authenticated using ((select auth.uid())=user_id);
create policy organization_read_member on public.organizations for select to authenticated using (
  exists (select 1 from public.organization_members m where m.organization_id=organizations.id and m.user_id=(select auth.uid()))
);
-- No client INSERT/UPDATE/DELETE grants on organizations or memberships.
-- No public commercial tables yet: inventory, proposals and sales need atomic
-- server operations, unique sale constraints and per-organization RLS tests.
commit;

