-- LOCAL REVIEW ONLY. Additive commercial model; no remote execution authorized.
begin;
create function public.commercial_member(p_org uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.organization_members where organization_id=p_org and user_id=(select auth.uid()) and role in ('owner','manager','seller'))
$$;
revoke all on function public.commercial_member(uuid) from public,anon;
grant execute on function public.commercial_member(uuid) to authenticated;

alter table public.vehicles add column commercial_status text not null default 'available' check(commercial_status in ('preparing','available','reserved','sold'));
alter table public.vehicles add column reserved_proposal_id uuid;
alter table public.vehicles add constraint vehicles_reservation_state check((commercial_status='reserved')=(reserved_proposal_id is not null));
alter table public.vehicles add constraint vehicles_id_org_unique unique(id,organization_id);
alter table public.listings add column vehicle_id uuid;
alter table public.listings add constraint listings_vehicle_org_fk foreign key(vehicle_id,organization_id) references public.vehicles(id,organization_id) on delete restrict;
alter table public.listings add constraint listings_vehicle_business check(vehicle_id is null or (organization_id is not null and category='vehicles'));
create unique index listings_one_vehicle on public.listings(vehicle_id) where vehicle_id is not null;
-- Existing title, asking price and media remain listing presentation; vehicle_id is its inventory identity.
grant insert(vehicle_id) on public.listings to authenticated;

create table public.customers(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 auth_user_id uuid references auth.users(id), name text not null check(length(trim(name)) between 1 and 150),
 email text not null default '' check(email='' or (length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
 phone text not null default '' check(phone='' or (length(phone) between 8 and 30 and phone ~ '^[+0-9 ()-]+$')),
 archived boolean not null default false, created_by uuid default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), unique(id,organization_id), unique(organization_id,auth_user_id)
);
create index customers_org_name on public.customers(organization_id,name);
create table public.proposals(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 customer_id uuid not null, vehicle_id uuid not null, listing_id uuid references public.listings(id) on delete restrict,
 buyer_user_id uuid references auth.users(id), created_by uuid not null references auth.users(id),
 amount numeric not null check(amount>0 and amount<=999999999999.99 and scale(amount)<=2),
 terms text not null check(length(trim(terms)) between 1 and 2000),
 status text not null default 'draft' check(status in ('draft','sent','accepted','rejected','cancelled','completed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(customer_id,organization_id) references public.customers(id,organization_id) on delete restrict,
 foreign key(vehicle_id,organization_id) references public.vehicles(id,organization_id) on delete restrict,
 unique(id,organization_id)
);
create index proposals_org_created on public.proposals(organization_id,created_at desc);
create index proposals_customer on public.proposals(customer_id);
create index proposals_vehicle on public.proposals(vehicle_id);
create index proposals_buyer on public.proposals(buyer_user_id);
alter table public.vehicles add constraint vehicles_reserved_proposal_fk foreign key(reserved_proposal_id,organization_id) references public.proposals(id,organization_id) on delete restrict;
create unique index proposals_one_open_buyer_listing on public.proposals(listing_id,buyer_user_id) where status in ('draft','sent','accepted') and buyer_user_id is not null;
create table public.sales(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 proposal_id uuid not null unique, vehicle_id uuid not null unique, customer_id uuid not null,
 seller_user_id uuid not null references auth.users(id), amount numeric not null check(amount>0 and amount<=999999999999.99 and scale(amount)<=2),
 sold_at timestamptz not null default now(), customer_name text not null, vehicle_title text not null, terms text not null,
 foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete restrict,
 foreign key(vehicle_id,organization_id) references public.vehicles(id,organization_id) on delete restrict,
 foreign key(customer_id,organization_id) references public.customers(id,organization_id) on delete restrict
);
create index sales_org_date on public.sales(organization_id,sold_at desc);
create index sales_customer on public.sales(customer_id);
create table public.proposal_events(
 id bigint generated always as identity primary key, proposal_id uuid not null references public.proposals(id) on delete restrict,
 actor_id uuid not null references auth.users(id), occurred_at timestamptz not null default now(),
 previous_status text, status text not null, amount numeric not null, terms text not null
);
create index proposal_events_proposal on public.proposal_events(proposal_id,occurred_at);
alter table public.customers enable row level security;
alter table public.proposals enable row level security;
alter table public.sales enable row level security;
alter table public.proposal_events enable row level security;
revoke all on public.customers,public.proposals,public.sales,public.proposal_events from anon,authenticated;
grant select,delete on public.customers to authenticated;
grant insert(organization_id,name,email,phone),update(name,email,phone,archived) on public.customers to authenticated;
grant select on public.proposals,public.sales,public.proposal_events to authenticated;
create policy customers_read on public.customers for select to authenticated using(public.commercial_member(organization_id));
create policy customers_insert on public.customers for insert to authenticated with check(public.commercial_member(organization_id));
create policy customers_update on public.customers for update to authenticated using(public.commercial_member(organization_id)) with check(public.commercial_member(organization_id));
create policy customers_delete on public.customers for delete to authenticated using(public.commercial_member(organization_id));
create policy proposals_read on public.proposals for select to authenticated using(public.commercial_member(organization_id) or buyer_user_id=(select auth.uid()));
create policy sales_read on public.sales for select to authenticated using(public.commercial_member(organization_id));
create policy proposal_events_read on public.proposal_events for select to authenticated using(exists(select 1 from public.proposals p where p.id=proposal_id));

-- No client can insert a sale or change proposal status directly. RPCs below are the write boundary.
-- DEFINER is needed to write protected tables atomically; each entry point verifies identity/organization.
create function public.commercial_ready() returns integer language sql stable security invoker set search_path='' as $$ select 1 where auth.uid() is not null $$;
create function public.commercial_create_proposal(p_org uuid,p_customer uuid,p_vehicle uuid,p_amount numeric,p_terms text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare result public.proposals; v public.vehicles;
begin
 if auth.uid() is null or not public.commercial_member(p_org) then raise exception 'Sem permissão.' using errcode='42501'; end if;
 select * into v from public.vehicles where id=p_vehicle and organization_id=p_org for update;
 if not found or v.commercial_status<>'available' then raise exception 'Veículo indisponível.';end if;
 perform 1 from public.customers where id=p_customer and organization_id=p_org and not archived for share;
 if not found then raise exception 'Cliente inválido ou arquivado.';end if;
 insert into public.proposals(organization_id,customer_id,vehicle_id,created_by,amount,terms)
 values(p_org,p_customer,p_vehicle,auth.uid(),p_amount,trim(p_terms)) returning * into result;
 return result;
end $$;
create function public.commercial_marketplace_offer(p_listing uuid,p_name text,p_phone text,p_amount numeric,p_terms text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare l public.listings; v public.vehicles; customer uuid; result public.proposals; buyer_email text;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into l from public.listings where id=p_listing;
 if not found or l.vehicle_id is null or l.organization_id is null then raise exception 'Anúncio sem vínculo comercial.';end if;
 select * into v from public.vehicles where id=l.vehicle_id for update;
 select * into l from public.listings where id=p_listing for share;
 if l.publication_status<>'published' or v.commercial_status<>'available' then raise exception 'Anúncio indisponível.';end if;
 if public.commercial_member(l.organization_id) then raise exception 'Use a Gestão para propostas da sua empresa.';end if;
 select * into result from public.proposals where listing_id=p_listing and buyer_user_id=auth.uid() and status in ('draft','sent','accepted');
 if found then return result;end if;
 select email into buyer_email from auth.users where id=auth.uid();
 insert into public.customers(organization_id,auth_user_id,name,email,phone,created_by)
 values(l.organization_id,auth.uid(),trim(p_name),coalesce(buyer_email,''),trim(p_phone),auth.uid())
 on conflict(organization_id,auth_user_id) do nothing returning id into customer;
 if customer is null then select id into customer from public.customers where organization_id=l.organization_id and auth_user_id=auth.uid() and not archived;end if;
 if customer is null then raise exception 'Cadastro indisponível. Contate a empresa.';end if;
 insert into public.proposals(organization_id,customer_id,vehicle_id,listing_id,buyer_user_id,created_by,amount,terms,status)
 values(l.organization_id,customer,l.vehicle_id,l.id,auth.uid(),auth.uid(),p_amount,trim(p_terms),'sent') returning * into result;
 return result;
end $$;
create function public.commercial_update_proposal(p_id uuid,p_amount numeric,p_terms text,p_status text)
returns public.proposals language plpgsql security definer set search_path='' as $$
declare proposal public.proposals; result public.proposals; vehicle uuid; staff boolean;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into proposal from public.proposals where id=p_id;
 if not found or not (public.commercial_member(proposal.organization_id) or coalesce(proposal.buyer_user_id=auth.uid(),false)) then raise exception 'Sem permissão.' using errcode='42501';end if;
 vehicle:=proposal.vehicle_id;
 perform 1 from public.vehicles where id=vehicle for update;
 select * into proposal from public.proposals where id=p_id for update;
 staff:=public.commercial_member(proposal.organization_id);
 if proposal.status in ('completed','rejected','cancelled') then raise exception 'Negociação encerrada.';end if;
 if not staff and not (coalesce(proposal.buyer_user_id=auth.uid(),false) and p_status='cancelled' and p_amount=proposal.amount and p_terms=proposal.terms) then raise exception 'Sem permissão.' using errcode='42501';end if;
 if proposal.status<>'draft' and (p_amount is distinct from proposal.amount or p_terms is distinct from proposal.terms) then raise exception 'Valores e condições só podem ser editados no rascunho.';end if;
 if not ((proposal.status='draft' and p_status in ('draft','sent','cancelled')) or (proposal.status='sent' and p_status in ('accepted','rejected','cancelled')) or (proposal.status='accepted' and p_status='cancelled')) then raise exception 'Transição inválida.';end if;
 if p_status in ('sent','accepted') and exists(select 1 from public.vehicles where id=vehicle and commercial_status<>'available') then raise exception 'Veículo indisponível.';end if;
 if p_status='cancelled' then update public.vehicles set commercial_status='available',reserved_proposal_id=null where id=vehicle and reserved_proposal_id=p_id;end if;
 update public.proposals set amount=p_amount,terms=trim(p_terms),status=p_status,updated_at=now() where id=p_id returning * into result;
 return result;
end $$;
create function public.commercial_complete_sale(p_proposal uuid)
returns public.sales language plpgsql security definer set search_path='' as $$
declare proposal public.proposals; vehicle public.vehicles; result public.sales; customer public.customers;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into proposal from public.proposals where id=p_proposal;
 if not found or not public.commercial_member(proposal.organization_id) then raise exception 'Sem permissão.' using errcode='42501';end if;
 -- All commercial operations lock the vehicle first, then the proposal.
 select * into vehicle from public.vehicles where id=proposal.vehicle_id for update;
 select * into proposal from public.proposals where id=p_proposal for update;
 select * into result from public.sales where proposal_id=p_proposal;
 if found then return result;end if; -- retry after a lost response is idempotent
 if not (vehicle.commercial_status='available' or (vehicle.commercial_status='reserved' and vehicle.reserved_proposal_id=proposal.id)) or proposal.status<>'accepted' then raise exception 'Aceite a proposta e confirme que o veículo está disponível ou reservado para ela.';end if;
 select * into customer from public.customers where id=proposal.customer_id for share;
 if customer.archived then raise exception 'Cliente arquivado.';end if;
 insert into public.sales(organization_id,proposal_id,vehicle_id,customer_id,seller_user_id,amount,customer_name,vehicle_title,terms)
 values(proposal.organization_id,proposal.id,vehicle.id,customer.id,auth.uid(),proposal.amount,customer.name,vehicle.title,proposal.terms) returning * into result;
 update public.vehicles set commercial_status='sold',reserved_proposal_id=null where id=vehicle.id;
 update public.proposals set status='completed',updated_at=now() where id=proposal.id;
 update public.proposals set status='cancelled',updated_at=now() where vehicle_id=vehicle.id and id<>proposal.id and status in ('draft','sent','accepted');
 update public.listings set publication_status='archived' where vehicle_id=vehicle.id;
 return result;
end $$;
create function public.commercial_record_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.proposal_events(proposal_id,actor_id,previous_status,status,amount,terms)
 values(new.id,auth.uid(),case when tg_op='UPDATE' then old.status else null end,new.status,new.amount,new.terms);
 return new;
end $$;
create trigger commercial_proposal_audit after insert or update on public.proposals for each row execute function public.commercial_record_event();
create function public.commercial_guard_vehicle() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and old.commercial_status='sold' and new is distinct from old then raise exception 'Veículo vendido: histórico preservado.';end if;
 if new.commercial_status='sold' and not exists(select 1 from public.sales where vehicle_id=new.id) then raise exception 'Conclua a venda para marcar como vendido.';end if;
 if new.commercial_status='reserved' and not exists(select 1 from public.proposals where id=new.reserved_proposal_id and vehicle_id=new.id and organization_id=new.organization_id and status='accepted') then raise exception 'A reserva exige uma proposta aceita deste veículo.';end if;
 return new;
end $$;
create trigger commercial_vehicle_guard before insert or update on public.vehicles for each row execute function public.commercial_guard_vehicle();
create function public.commercial_guard_listing() returns trigger language plpgsql security definer set search_path='' as $$
declare vehicle public.vehicles;
begin
 if tg_op='UPDATE' and (new.vehicle_id is distinct from old.vehicle_id or new.organization_id is distinct from old.organization_id) and old.vehicle_id is not null then raise exception 'O vínculo com o estoque não pode ser alterado.';end if;
 if new.vehicle_id is not null then
  select * into vehicle from public.vehicles where id=new.vehicle_id for update;
  if not found or vehicle.organization_id is distinct from new.organization_id then raise exception 'Veículo de outra empresa.';end if;
  if new.publication_status='published' and vehicle.commercial_status<>'available' then raise exception 'Somente veículos disponíveis podem ser publicados.';end if;
 end if;
 return new;
end $$;
create trigger commercial_listing_guard before insert or update on public.listings for each row execute function public.commercial_guard_listing();
create function public.commercial_set_vehicle_state(p_vehicle uuid,p_status text,p_proposal uuid default null)
returns public.vehicles language plpgsql security definer set search_path='' as $$
declare vehicle public.vehicles; proposal public.proposals;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into vehicle from public.vehicles where id=p_vehicle;
 if not found or not public.commercial_member(vehicle.organization_id) then raise exception 'Sem permissão.' using errcode='42501';end if;
 select * into vehicle from public.vehicles where id=p_vehicle for update;
 if vehicle.commercial_status='sold' then raise exception 'Veículo vendido: histórico preservado.';end if;
 if p_status is null or p_status not in ('preparing','available','reserved') then raise exception 'Estado inválido. Venda deve ser concluída pela proposta.';end if;
 if p_status='reserved' then
  if vehicle.commercial_status<>'available' then raise exception 'Somente um veículo disponível pode ser reservado.';end if;
  select * into proposal from public.proposals where id=p_proposal and vehicle_id=p_vehicle and organization_id=vehicle.organization_id for update;
  if not found or proposal.status<>'accepted' then raise exception 'Escolha uma proposta aceita deste veículo.';end if;
 elsif p_proposal is not null then raise exception 'Proposta é usada somente para reserva.';
 elsif vehicle.commercial_status='reserved' and p_status<>'available' then raise exception 'Libere a reserva antes de preparar o veículo.';
 end if;
 update public.vehicles set commercial_status=p_status,reserved_proposal_id=p_proposal where id=p_vehicle returning * into vehicle;
 if p_status<>'available' then update public.listings set publication_status='archived' where vehicle_id=p_vehicle and publication_status='published';end if;
 -- Release never republishes automatically: a seller explicitly reviews and publishes again.
 return vehicle;
end $$;
revoke all on function public.commercial_set_vehicle_state(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.commercial_set_vehicle_state(uuid,text,uuid) to authenticated;
revoke all on function public.commercial_ready(),public.commercial_create_proposal(uuid,uuid,uuid,numeric,text),public.commercial_marketplace_offer(uuid,text,text,numeric,text),public.commercial_update_proposal(uuid,numeric,text,text),public.commercial_complete_sale(uuid),public.commercial_record_event(),public.commercial_guard_vehicle(),public.commercial_guard_listing() from public,anon,authenticated;
grant execute on function public.commercial_ready(),public.commercial_create_proposal(uuid,uuid,uuid,numeric,text),public.commercial_marketplace_offer(uuid,text,text,numeric,text),public.commercial_update_proposal(uuid,numeric,text,text),public.commercial_complete_sale(uuid) to authenticated;
create function public.commercial_summary() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('open_proposals',(select count(*) from public.proposals where public.commercial_member(organization_id) and status in ('draft','sent','accepted')),'sales_count',(select count(*) from public.sales),'sales_amount',(select coalesce(sum(amount),0) from public.sales)) where auth.uid() is not null
$$;
revoke all on function public.commercial_summary() from public,anon;
grant execute on function public.commercial_summary() to authenticated;
commit;
