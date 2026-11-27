-- MotorSync: lista privada de anúncios favoritos vinculada à conta autenticada.
-- Migração preparada para revisão; NÃO APLICADA REMOTAMENTE nesta etapa.
begin;

create table public.listing_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index listing_favorites_recent_idx on public.listing_favorites(user_id, created_at desc);

alter table public.listing_favorites enable row level security;
revoke all on public.listing_favorites from public, anon, authenticated;
grant select, insert, delete on public.listing_favorites to authenticated;

create policy listing_favorites_private_read on public.listing_favorites
  for select to authenticated using (user_id = (select auth.uid()));

create policy listing_favorites_private_add on public.listing_favorites
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.publication_status = 'published'
    )
  );

create policy listing_favorites_private_remove on public.listing_favorites
  for delete to authenticated using (user_id = (select auth.uid()));

commit;
