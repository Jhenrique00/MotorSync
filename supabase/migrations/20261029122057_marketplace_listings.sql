-- NEW migration. Review before applying. Existing identity and vehicles tables remain intact.
begin;
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id),
  organization_id uuid references public.organizations(id),
  category text not null check (category in ('vehicles','parts','accessories')),
  subcategory text not null,
  title text not null check (length(btrim(title)) between 1 and 150),
  price numeric not null check (price between 0.01 and 999999999999.99 and scale(price)<=2),
  location text not null check (length(btrim(location)) between 1 and 150),
  description text not null default '' check (length(description) <= 4000),
  attributes jsonb not null default '{}' check (jsonb_typeof(attributes) = 'object'),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 6),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  constraint listing_one_owner check ((owner_user_id is null) <> (organization_id is null))
);
alter table public.listings enable row level security;
create index listings_personal_idx on public.listings(owner_user_id,created_at desc);
create index listings_organization_idx on public.listings(organization_id,created_at desc);
create index listings_marketplace_idx on public.listings(category,subcategory,created_at desc) where publication_status='published';
-- Supabase projects may grant broad default privileges: explicitly replace them.
revoke all on public.listings from public, anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert (owner_user_id,organization_id,category,subcategory,title,price,location,description,attributes,photo_paths,publication_status) on public.listings to authenticated;
grant delete on public.listings to authenticated;
grant update (category,subcategory,title,price,location,description,attributes,photo_paths,publication_status) on public.listings to authenticated;
create policy listings_public_read on public.listings for select to anon,authenticated using (publication_status='published');
create policy listings_private_read on public.listings for select to authenticated using (
  owner_user_id=(select auth.uid()) or exists (
    select 1 from public.organization_members m where m.organization_id=listings.organization_id and m.user_id=(select auth.uid())
  )
);
create policy listings_insert on public.listings for insert to authenticated with check (
  owner_user_id=(select auth.uid()) or exists (
    select 1 from public.organization_members m where m.organization_id=listings.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller')
  )
);
create policy listings_update on public.listings for update to authenticated using (
  owner_user_id=(select auth.uid()) or exists (select 1 from public.organization_members m where m.organization_id=listings.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller'))
) with check (
  owner_user_id=(select auth.uid()) or exists (select 1 from public.organization_members m where m.organization_id=listings.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller'))
);
create policy listings_delete on public.listings for delete to authenticated using (
  owner_user_id=(select auth.uid()) or exists (select 1 from public.organization_members m where m.organization_id=listings.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller'))
);
-- No costs, margins, phone, email, or customer data is placed in this public entity.
create function public.validate_listing() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text; v jsonb; allowed text[]; photo_prefix text; number_value numeric;
begin
  if new.category='vehicles' and new.subcategory not in ('cars','motorcycles','trucks','buses','vans','boats','motorhomes','other-vehicles') or
     new.category='parts' and new.subcategory not in ('engine','transmission','suspension','brakes','electrical','lighting','cooling','body','other-parts') or
     new.category='accessories' and new.subcategory not in ('wheels','audio','interior','exterior','protection','tools','care','other-accessories') then
    raise exception 'Categoria e subcategoria incompatíveis';
  end if;
  allowed := case
    when new.category='parts' then array['brand','reference','condition','compatibility','quantity']
    when new.category='accessories' then array['brand','specification','compatibility','condition','quantity']
    when new.subcategory='boats' then array['brand','model','year','length','engine','hours','condition']
    when new.subcategory='motorcycles' then array['brand','model','year','displacement','mileage','condition']
    when new.subcategory='trucks' then array['brand','model','year','mileage','body','axles','traction','condition']
    else array['brand','model','version','year','mileage','fuel','transmission','condition'] end;
  for k,v in select * from jsonb_each(new.attributes) loop
    if not (k=any(allowed)) or jsonb_typeof(v) not in ('string','number') or char_length(v#>>'{}')>300 then
      raise exception 'Atributo inválido';
    end if;
    if k in ('year','mileage','displacement','axles','length','hours','quantity') and (v#>>'{}') !~ '^\d+(\.\d+)?$' then raise exception 'Número inválido'; end if;
    if k='year' and ((v#>>'{}')::numeric<1900 or (v#>>'{}')::numeric>extract(year from now())+1) then raise exception 'Ano inválido'; end if;
    if k in ('year','mileage','displacement','axles','length','hours','quantity') then
      number_value:=(v#>>'{}')::numeric;
      if k<>'length' and (v#>>'{}') !~ '^\d+$' then raise exception 'Informe um número inteiro'; end if;
      if (k='mileage' and number_value>10000000) or
         (k='displacement' and (number_value<1 or number_value>100000)) or
         (k='axles' and (number_value<1 or number_value>20)) or
         (k='length' and (number_value<0.01 or number_value>500 or scale(number_value)>2)) or
         (k='hours' and number_value>1000000) or
         (k='quantity' and (number_value<1 or number_value>1000000)) then raise exception 'Número fora do limite'; end if;
    end if;
    if k='condition' and v#>>'{}' not in ('Novo','Usado','Recondicionado') then raise exception 'Condição inválida'; end if;
    if k='fuel' and v#>>'{}' not in ('Flex','Gasolina','Diesel','Etanol','Elétrico','Híbrido','Outro') then raise exception 'Combustível inválido'; end if;
    if k='transmission' and v#>>'{}' not in ('Manual','Automático','Automatizado','CVT','Outro') then raise exception 'Câmbio inválido'; end if;
  end loop;
  photo_prefix:=case when new.organization_id is not null then 'org/'||new.organization_id::text||'/' else 'user/'||new.owner_user_id::text||'/' end;
  if exists(select 1 from unnest(new.photo_paths) p where p is null or p !~ '^(user|org)/[0-9a-f-]{36}/[0-9a-z-]+\.(jpg|png|webp)$' or left(p,length(photo_prefix))<>photo_prefix) then raise exception 'Foto não pertence ao titular do anúncio'; end if;
  if cardinality(new.photo_paths)<>(select count(distinct p) from unnest(new.photo_paths) p) then raise exception 'Fotos duplicadas'; end if;
  -- SECURITY INVOKER: checks metadata visible through Storage RLS, never filesystem access.
  -- Binary download remains a Storage API verification, not something SQL alone can guarantee.
  if exists(select 1 from unnest(new.photo_paths) p where not exists(select 1 from storage.objects o where o.bucket_id='listing-photos' and o.name=p)) then raise exception 'Foto inexistente ou sem acesso. Envie a foto antes de salvar.'; end if;
  return new;
end $$;
revoke all on function public.validate_listing() from public, anon, authenticated;
create trigger validate_listing before insert or update on public.listings for each row execute function public.validate_listing();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('listing-photos','listing-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy listing_photos_insert on storage.objects for insert to authenticated with check (
  bucket_id='listing-photos' and name ~ '^(user|org)/[0-9a-f-]{36}/[0-9a-z-]+\.(jpg|png|webp)$' and (
    ((storage.foldername(name))[1]='user' and (storage.foldername(name))[2]=(select auth.uid())::text) or
    ((storage.foldername(name))[1]='org' and exists(select 1 from public.organization_members m where m.organization_id::text=(storage.foldername(name))[2] and m.user_id=(select auth.uid()) and m.role in ('owner','manager','seller')))
  )
);
create policy listing_photos_public_read on storage.objects for select to anon,authenticated using (
  bucket_id='listing-photos' and exists(select 1 from public.listings l where l.publication_status='published' and name=any(l.photo_paths))
);
create policy listing_photos_private_read on storage.objects for select to authenticated using (
  bucket_id='listing-photos' and (
    ((storage.foldername(name))[1]='user' and (storage.foldername(name))[2]=(select auth.uid())::text) or
    ((storage.foldername(name))[1]='org' and exists(select 1 from public.organization_members m where m.organization_id::text=(storage.foldername(name))[2] and m.user_id=(select auth.uid())))
  )
);
-- No client UPDATE/DELETE policy for photos: a former team member cannot destroy shared media.
-- Unreferenced media cleanup is an administrative operation after retention review.
commit;
