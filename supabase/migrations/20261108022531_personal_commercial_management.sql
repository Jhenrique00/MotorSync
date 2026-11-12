-- REVIEW REQUIRED. Never apply without explicit authorization.
-- Extends existing tables; preserves corporate rows and historical sales.
begin;
create function public.commercial_access(p_org uuid,p_owner uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and ((p_org is null and p_owner=auth.uid()) or (p_owner is null and public.commercial_member(p_org)))
$$;
revoke all on function public.commercial_access(uuid,uuid) from public,anon;
grant execute on function public.commercial_access(uuid,uuid) to authenticated;
alter table public.vehicles alter column organization_id drop not null;
alter table public.vehicles add column owner_user_id uuid references auth.users(id);
alter table public.vehicles add constraint vehicles_one_owner check ((organization_id is null) <> (owner_user_id is null));
grant insert(owner_user_id) on public.vehicles to authenticated;
alter table public.customers alter column organization_id drop not null;
alter table public.customers add column owner_user_id uuid references auth.users(id);
alter table public.customers add constraint customers_one_owner check ((organization_id is null) <> (owner_user_id is null));
grant insert(owner_user_id) on public.customers to authenticated;
alter table public.proposals alter column organization_id drop not null;
alter table public.proposals add column owner_user_id uuid references auth.users(id);
alter table public.proposals add constraint proposals_one_owner check ((organization_id is null) <> (owner_user_id is null));
grant insert(owner_user_id) on public.proposals to authenticated;
alter table public.sales alter column organization_id drop not null;
alter table public.sales add column owner_user_id uuid references auth.users(id);
alter table public.sales add constraint sales_one_owner check ((organization_id is null) <> (owner_user_id is null));
grant insert(owner_user_id) on public.sales to authenticated;
revoke insert(owner_user_id) on public.proposals,public.sales from authenticated;
alter table public.customers add column notes text not null default '' check(length(notes)<=4000);
grant insert(notes),update(notes) on public.customers to authenticated;
alter table public.proposals alter column vehicle_id drop not null;
alter table public.sales alter column proposal_id drop not null;
create unique index customers_person_buyer on public.customers(owner_user_id,auth_user_id) where owner_user_id is not null and auth_user_id is not null;
alter table public.vehicles add column scope_key text generated always as (case when organization_id is not null then 'org:'||organization_id::text else 'user:'||owner_user_id::text end) stored;
alter table public.vehicles add constraint vehicles_id_scope unique(id,scope_key);
alter table public.customers add column scope_key text generated always as (case when organization_id is not null then 'org:'||organization_id::text else 'user:'||owner_user_id::text end) stored;
alter table public.customers add constraint customers_id_scope unique(id,scope_key);
alter table public.proposals add column scope_key text generated always as (case when organization_id is not null then 'org:'||organization_id::text else 'user:'||owner_user_id::text end) stored;
alter table public.proposals add constraint proposals_id_scope unique(id,scope_key);
alter table public.sales add column scope_key text generated always as (case when organization_id is not null then 'org:'||organization_id::text else 'user:'||owner_user_id::text end) stored;
alter table public.sales add constraint sales_id_scope unique(id,scope_key);
alter table public.listings add column scope_key text generated always as (case when organization_id is not null then 'org:'||organization_id::text else 'user:'||owner_user_id::text end) stored;
alter table public.listings add constraint listings_id_scope unique(id,scope_key);
alter table public.proposals add constraint proposals_customer_id_scope_fk foreign key(customer_id,scope_key) references public.customers(id,scope_key) on delete restrict;
alter table public.proposals add constraint proposals_vehicle_id_scope_fk foreign key(vehicle_id,scope_key) references public.vehicles(id,scope_key) on delete restrict;
alter table public.proposals add constraint proposals_listing_id_scope_fk foreign key(listing_id,scope_key) references public.listings(id,scope_key) on delete restrict;
alter table public.sales add constraint sales_customer_id_scope_fk foreign key(customer_id,scope_key) references public.customers(id,scope_key) on delete restrict;
alter table public.sales add constraint sales_vehicle_id_scope_fk foreign key(vehicle_id,scope_key) references public.vehicles(id,scope_key) on delete restrict;
alter table public.sales add constraint sales_proposal_id_scope_fk foreign key(proposal_id,scope_key) references public.proposals(id,scope_key) on delete restrict;
alter table public.vehicles add constraint vehicles_reserved_proposal_id_scope_fk foreign key(reserved_proposal_id,scope_key) references public.proposals(id,scope_key) on delete restrict;
alter table public.listings add constraint listings_vehicle_id_scope_fk foreign key(vehicle_id,scope_key) references public.vehicles(id,scope_key) on delete restrict;
alter table public.listings drop constraint listings_vehicle_business;
alter table public.listings add constraint listings_vehicle_category check(vehicle_id is null or category='vehicles');
alter table public.vehicles add column purchase_cost numeric check(purchase_cost>=0 and purchase_cost<=999999999999.99 and scale(purchase_cost)<=2);
alter table public.vehicles add column preparation_cost numeric check(preparation_cost>=0 and preparation_cost<=999999999999.99 and scale(preparation_cost)<=2);
alter table public.sales add column purchase_cost numeric check(purchase_cost>=0 and purchase_cost<=999999999999.99 and scale(purchase_cost)<=2);
alter table public.sales add column preparation_cost numeric check(preparation_cost>=0 and preparation_cost<=999999999999.99 and scale(preparation_cost)<=2);
grant insert(purchase_cost,preparation_cost),update(purchase_cost,preparation_cost) on public.vehicles to authenticated;
alter policy vehicles_read on public.vehicles using(public.commercial_access(organization_id,owner_user_id)) ;
alter policy vehicles_insert on public.vehicles  with check(public.commercial_access(organization_id,owner_user_id));
alter policy vehicles_update on public.vehicles using(public.commercial_access(organization_id,owner_user_id)) with check(public.commercial_access(organization_id,owner_user_id));
alter policy vehicles_delete on public.vehicles using(public.commercial_access(organization_id,owner_user_id)) ;
alter policy customers_read on public.customers using(public.commercial_access(organization_id,owner_user_id)) ;
alter policy customers_insert on public.customers  with check(public.commercial_access(organization_id,owner_user_id));
alter policy customers_update on public.customers using(public.commercial_access(organization_id,owner_user_id)) with check(public.commercial_access(organization_id,owner_user_id));
alter policy customers_delete on public.customers using(public.commercial_access(organization_id,owner_user_id)) ;
alter policy proposals_read on public.proposals using(public.commercial_access(organization_id,owner_user_id) or buyer_user_id=(select auth.uid()));
alter policy sales_read on public.sales using(public.commercial_access(organization_id,owner_user_id));
create or replace function public.commercial_ready() returns integer language sql stable security invoker set search_path='' as $$ select 2 where auth.uid() is not null $$;
create or replace function public.commercial_create_proposal(p_org uuid,p_customer uuid,p_vehicle uuid,p_amount numeric,p_terms text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare result public.proposals; v public.vehicles;
begin
 if auth.uid() is null or not public.commercial_access(p_org,case when p_org is null then auth.uid() end) then raise exception 'Sem permissão.' using errcode='42501'; end if;
 select * into v from public.vehicles where id=p_vehicle and organization_id is not distinct from p_org and public.commercial_access(organization_id,owner_user_id) for update;
 if p_vehicle is not null and (not found or v.commercial_status<>'available') then raise exception 'Veículo indisponível.';end if;
 perform 1 from public.customers where id=p_customer and organization_id is not distinct from p_org and public.commercial_access(organization_id,owner_user_id) and not archived for share;
 if not found then raise exception 'Cliente inválido ou arquivado.';end if;
 insert into public.proposals(owner_user_id,organization_id,customer_id,vehicle_id,created_by,amount,terms)
 values(case when p_org is null then auth.uid() end,p_org,p_customer,p_vehicle,auth.uid(),p_amount,trim(p_terms)) returning * into result;
 return result;
end $$;
create or replace function public.commercial_marketplace_offer(p_listing uuid,p_name text,p_phone text,p_amount numeric,p_terms text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare l public.listings; v public.vehicles; customer uuid; result public.proposals; buyer_email text;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into l from public.listings where id=p_listing and publication_status='published';
 if not found or l.vehicle_id is null then raise exception 'Anúncio indisponível.';end if;
 select * into v from public.vehicles where id=l.vehicle_id for update;
 select * into l from public.listings where id=p_listing for share;
 if l.publication_status<>'published' or v.commercial_status<>'available' then raise exception 'Anúncio indisponível.';end if;
 if public.commercial_access(l.organization_id,l.owner_user_id) then raise exception 'Use a Gestão para propostas da sua empresa.';end if;
 select * into result from public.proposals where listing_id=p_listing and buyer_user_id=auth.uid() and status in ('draft','sent','accepted');
 if found then return result;end if;
 select email into buyer_email from auth.users where id=auth.uid();
 insert into public.customers(owner_user_id,organization_id,auth_user_id,name,email,phone,created_by)
 values(l.owner_user_id,l.organization_id,auth.uid(),trim(p_name),coalesce(buyer_email,''),trim(p_phone),auth.uid())
 on conflict do nothing returning id into customer;
 if customer is null then select id into customer from public.customers where scope_key=l.scope_key and auth_user_id=auth.uid() and not archived;end if;
 if customer is null then raise exception 'Cadastro indisponível. Contate a empresa.';end if;
 insert into public.proposals(owner_user_id,organization_id,customer_id,vehicle_id,listing_id,buyer_user_id,created_by,amount,terms,status)
 values(l.owner_user_id,l.organization_id,customer,l.vehicle_id,l.id,auth.uid(),auth.uid(),p_amount,trim(p_terms),'sent') returning * into result;
 return result;
end $$;
create or replace function public.commercial_update_proposal(p_id uuid,p_amount numeric,p_terms text,p_status text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare proposal public.proposals; result public.proposals; vehicle uuid; staff boolean;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into proposal from public.proposals where id=p_id;
 if not found or not (public.commercial_access(proposal.organization_id,proposal.owner_user_id) or coalesce(proposal.buyer_user_id=auth.uid(),false)) then raise exception 'Sem permissão.' using errcode='42501';end if;
 vehicle:=proposal.vehicle_id;
 perform 1 from public.vehicles where id=vehicle for update;
 select * into proposal from public.proposals where id=p_id for update;
 staff:=public.commercial_access(proposal.organization_id,proposal.owner_user_id);
 if proposal.status in ('completed','rejected','cancelled') then raise exception 'Negociação encerrada.';end if;
 if not staff and not (coalesce(proposal.buyer_user_id=auth.uid(),false) and p_status='cancelled' and p_amount=proposal.amount and p_terms=proposal.terms) then raise exception 'Sem permissão.' using errcode='42501';end if;
 if proposal.status<>'draft' and (p_amount is distinct from proposal.amount or p_terms is distinct from proposal.terms) then raise exception 'Valores e condições só podem ser editados no rascunho.';end if;
 if not ((proposal.status='draft' and p_status in ('draft','sent','cancelled')) or (proposal.status='sent' and p_status in ('accepted','rejected','cancelled')) or (proposal.status='accepted' and p_status='cancelled')) then raise exception 'Transição inválida.';end if;
 if p_status in ('sent','accepted') and exists(select 1 from public.vehicles where id=vehicle and commercial_status<>'available') then raise exception 'Veículo indisponível.';end if;
 if p_status='cancelled' then update public.vehicles set commercial_status='available',reserved_proposal_id=null where id=vehicle and reserved_proposal_id=p_id;end if;
 update public.proposals set amount=p_amount,terms=trim(p_terms),status=p_status,updated_at=now() where id=p_id returning * into result;
 return result;
end $$;
create or replace function public.commercial_complete_sale(p_proposal uuid)
returns public.sales language plpgsql security definer set search_path='' as $$
declare proposal public.proposals; vehicle public.vehicles; result public.sales; customer public.customers;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into proposal from public.proposals where id=p_proposal;
 if not found or not public.commercial_access(proposal.organization_id,proposal.owner_user_id) then raise exception 'Sem permissão.' using errcode='42501';end if;
 if proposal.vehicle_id is null then raise exception 'Vincule um veículo antes de concluir a venda.';end if;
 -- All commercial operations lock the vehicle first, then the proposal.
 select * into vehicle from public.vehicles where id=proposal.vehicle_id for update;
 select * into proposal from public.proposals where id=p_proposal for update;
 select * into result from public.sales where proposal_id=p_proposal;
 if found then return result;end if; -- retry after a lost response is idempotent
 if not (vehicle.commercial_status='available' or (vehicle.commercial_status='reserved' and vehicle.reserved_proposal_id=proposal.id)) or proposal.status<>'accepted' then raise exception 'Aceite a proposta e confirme que o veículo está disponível ou reservado para ela.';end if;
 select * into customer from public.customers where id=proposal.customer_id for share;
 if customer.archived then raise exception 'Cliente arquivado.';end if;
 insert into public.sales(owner_user_id,organization_id,proposal_id,vehicle_id,customer_id,seller_user_id,amount,customer_name,vehicle_title,terms)
 values(proposal.owner_user_id,proposal.organization_id,proposal.id,vehicle.id,customer.id,auth.uid(),proposal.amount,customer.name,vehicle.title,proposal.terms) returning * into result;
 update public.vehicles set commercial_status='sold',reserved_proposal_id=null where id=vehicle.id;
 update public.proposals set status='completed',updated_at=now() where id=proposal.id;
 update public.proposals set status='cancelled',updated_at=now() where vehicle_id=vehicle.id and id<>proposal.id and status in ('draft','sent','accepted');
 update public.listings set publication_status='archived' where vehicle_id=vehicle.id;
 return result;
end $$;
create or replace function public.commercial_guard_vehicle() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and old.commercial_status='sold' and new is distinct from old then raise exception 'Veículo vendido: histórico preservado.';end if;
 if new.commercial_status='sold' and not exists(select 1 from public.sales where vehicle_id=new.id) then raise exception 'Conclua a venda para marcar como vendido.';end if;
 if new.commercial_status='reserved' and not exists(select 1 from public.proposals where id=new.reserved_proposal_id and vehicle_id=new.id and organization_id is not distinct from new.organization_id and owner_user_id is not distinct from new.owner_user_id and status='accepted') then raise exception 'A reserva exige uma proposta aceita deste veículo.';end if;
 return new;
end $$;
create or replace function public.commercial_guard_listing() returns trigger language plpgsql security definer set search_path='' as $$
declare vehicle public.vehicles;
begin
 if tg_op='UPDATE' and (new.vehicle_id is distinct from old.vehicle_id or new.organization_id is distinct from old.organization_id) and old.vehicle_id is not null then raise exception 'O vínculo com o estoque não pode ser alterado.';end if;
 if new.vehicle_id is not null then
  select * into vehicle from public.vehicles where id=new.vehicle_id for update;
  if not found or (vehicle.organization_id is distinct from new.organization_id or vehicle.owner_user_id is distinct from new.owner_user_id) then raise exception 'Veículo de outra empresa.';end if;
  if new.publication_status='published' and vehicle.commercial_status<>'available' then raise exception 'Somente veículos disponíveis podem ser publicados.';end if;
 end if;
 return new;
end $$;
create or replace function public.commercial_set_vehicle_state(p_vehicle uuid,p_status text,p_proposal uuid default null)
returns public.vehicles language plpgsql security definer set search_path='' as $$
declare vehicle public.vehicles; proposal public.proposals;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into vehicle from public.vehicles where id=p_vehicle;
 if not found or not public.commercial_access(vehicle.organization_id,vehicle.owner_user_id) then raise exception 'Sem permissão.' using errcode='42501';end if;
 select * into vehicle from public.vehicles where id=p_vehicle for update;
 if vehicle.commercial_status='sold' then raise exception 'Veículo vendido: histórico preservado.';end if;
 if p_status is null or p_status not in ('preparing','available','reserved') then raise exception 'Estado inválido. Venda deve ser concluída pela proposta.';end if;
 if p_status='reserved' then
  if vehicle.commercial_status<>'available' then raise exception 'Somente um veículo disponível pode ser reservado.';end if;
  select * into proposal from public.proposals where id=p_proposal and vehicle_id=p_vehicle and scope_key=vehicle.scope_key for update;
  if not found or proposal.status<>'accepted' then raise exception 'Escolha uma proposta aceita deste veículo.';end if;
 elsif p_proposal is not null then raise exception 'Proposta é usada somente para reserva.';
 elsif vehicle.commercial_status='reserved' and p_status<>'available' then raise exception 'Libere a reserva antes de preparar o veículo.';
 end if;
 update public.vehicles set commercial_status=p_status,reserved_proposal_id=p_proposal where id=p_vehicle returning * into vehicle;
 if p_status<>'available' then update public.listings set publication_status='archived' where vehicle_id=p_vehicle and publication_status='published';end if;
 -- Release never republishes automatically: a seller explicitly reviews and publishes again.
 return vehicle;
end $$;
create or replace function public.commercial_summary() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('open_proposals',(select count(*) from public.proposals where public.commercial_access(organization_id,owner_user_id) and status in ('draft','sent','accepted')),'sales_count',(select count(*) from public.sales),'sales_amount',(select coalesce(sum(amount),0) from public.sales)) where auth.uid() is not null
$$;

-- Snapshot known costs at sale time; unknown remains NULL, never inferred as zero.
create function public.commercial_sale_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 select purchase_cost,preparation_cost into new.purchase_cost,new.preparation_cost from public.vehicles where id=new.vehicle_id;
 return new;
end $$;
revoke all on function public.commercial_sale_snapshot() from public,anon,authenticated;
create trigger commercial_sale_snapshot before insert on public.sales for each row execute function public.commercial_sale_snapshot();
create function public.commercial_direct_sale(p_vehicle uuid,p_customer uuid,p_amount numeric,p_terms text,p_sold_at timestamptz)
returns public.sales language plpgsql security definer set search_path='' as $$
declare v public.vehicles;c public.customers;s public.sales;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into v from public.vehicles where id=p_vehicle for update;
 if not found or not public.commercial_access(v.organization_id,v.owner_user_id) then raise exception 'Sem permissão.' using errcode='42501';end if;
 select * into s from public.sales where vehicle_id=p_vehicle;
 if found then
  if s.proposal_id is null and s.customer_id=p_customer and s.amount=p_amount and s.terms=trim(p_terms) and s.sold_at=p_sold_at then return s;end if;
  raise exception 'Veículo já vendido. Atualize o histórico.';
 end if;
 if v.commercial_status<>'available' then raise exception 'Venda direta exige veículo disponível. Libere a reserva ou conclua pela proposta.';end if;
 select * into c from public.customers where id=p_customer and scope_key=v.scope_key and not archived for share;
 if not found then raise exception 'Cliente inválido ou arquivado.';end if;
 if p_sold_at is null or p_sold_at>now()+interval '5 minutes' or p_sold_at<'1900-01-01'::timestamptz then raise exception 'Data da venda inválida.';end if;
 if p_terms is null or length(trim(p_terms)) not between 1 and 2000 then raise exception 'Condições inválidas.';end if;
 insert into public.sales(owner_user_id,organization_id,vehicle_id,customer_id,seller_user_id,amount,sold_at,customer_name,vehicle_title,terms)
 values(v.owner_user_id,v.organization_id,v.id,c.id,auth.uid(),p_amount,p_sold_at,c.name,v.title,trim(p_terms)) returning * into s;
 update public.vehicles set commercial_status='sold',reserved_proposal_id=null where id=v.id;
 update public.proposals set status='cancelled',updated_at=now() where vehicle_id=v.id and status in ('draft','sent','accepted');
 update public.listings set publication_status='archived' where vehicle_id=v.id;
 return s;
end $$;
revoke all on function public.commercial_direct_sale(uuid,uuid,numeric,text,timestamptz) from public,anon;
grant execute on function public.commercial_direct_sale(uuid,uuid,numeric,text,timestamptz) to authenticated;
create function public.commercial_edit_draft(p_id uuid,p_vehicle uuid,p_amount numeric,p_terms text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare p public.proposals;v public.vehicles;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_vehicle is not null then select * into v from public.vehicles where id=p_vehicle for update;end if;
 select * into p from public.proposals where id=p_id for update;
 if not found or not public.commercial_access(p.organization_id,p.owner_user_id) then raise exception 'Sem permissão.' using errcode='42501';end if;
 if p.status<>'draft' then raise exception 'Somente rascunhos podem ser editados.';end if;
 if p_vehicle is not null and (v.id is null or v.scope_key<>p.scope_key or v.commercial_status<>'available') then raise exception 'Veículo indisponível.';end if;
 update public.proposals set vehicle_id=p_vehicle,amount=p_amount,terms=trim(p_terms),updated_at=now() where id=p_id returning * into p;
 return p;
end $$;
revoke all on function public.commercial_edit_draft(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.commercial_edit_draft(uuid,uuid,numeric,text) to authenticated;
commit;
