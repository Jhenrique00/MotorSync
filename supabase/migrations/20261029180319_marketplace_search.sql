-- DRAFT: administrative review required. Do not apply automatically.
begin;
create function public.search_listings(p_options jsonb default '{}',p_offset integer default 0,p_limit integer default 20)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 c text:=coalesce(p_options->>'category',''); s text:=coalesce(p_options->>'subcategory','');
 f jsonb:=coalesce(p_options->'filters','{}'); k text; v text; field text; bound text; expr text;
 allowed text[]; predicate text:='l.publication_status=''published'''; ordering text;
 n numeric; lo numeric; hi numeric; max_scale integer; result jsonb; search_term text;
begin
 if jsonb_typeof(p_options)<>'object' or jsonb_typeof(f)<>'object' or p_offset<0 or p_offset>100000 or p_limit<1 or p_limit>50 then raise exception 'Consulta inválida'; end if;
 if c not in ('','vehicles','parts','accessories') then raise exception 'Categoria inválida'; end if;
 if s<>'' and not exists(select 1 from (values
 ('vehicles','cars'),('vehicles','motorcycles'),('vehicles','trucks'),('vehicles','buses'),('vehicles','vans'),('vehicles','boats'),('vehicles','motorhomes'),('vehicles','other-vehicles'),
 ('parts','engine'),('parts','transmission'),('parts','suspension'),('parts','brakes'),('parts','electrical'),('parts','lighting'),('parts','cooling'),('parts','body'),('parts','other-parts'),
 ('accessories','wheels'),('accessories','audio'),('accessories','interior'),('accessories','exterior'),('accessories','protection'),('accessories','tools'),('accessories','care'),('accessories','other-accessories')) t(category,subcategory) where t.category=c and t.subcategory=s) then raise exception 'Tipo incompatível'; end if;
 allowed:=array['price','location'] || case
 when c='parts' then array['brand','reference','condition','compatibility','quantity']
 when c='accessories' then array['brand','specification','compatibility','condition','quantity']
 when c<>'vehicles' or s='' then array[]::text[]
 when s='boats' then array['brand','model','year','length','engine','hours','condition']
 when s='motorcycles' then array['brand','model','year','displacement','mileage','condition']
 when s='trucks' then array['brand','model','year','mileage','body','axles','traction','condition']
 else array['brand','model','version','year','mileage','fuel','transmission','condition'] end;
 if c<>'' then predicate:=predicate||format(' and l.category=%L',c); end if;
 if s<>'' then predicate:=predicate||format(' and l.subcategory=%L',s); end if;
 search_term:=btrim(coalesce(p_options->>'query',''));
 if length(search_term)>150 then raise exception 'Busca longa demais'; end if;
 if search_term<>'' then predicate:=predicate||format(' and strpos(lower(concat_ws('' '',l.title,l.location,l.attributes->>''brand'',l.attributes->>''model'')),lower(%L))>0',search_term); end if;
 for k,v in select key,value from jsonb_each_text(f) loop
  if v='' then continue; end if;
  field:=split_part(k,':',1);bound:=split_part(k,':',2);
  if not field=any(allowed) or length(v)>300 or (k<>field and k not in (field||':min',field||':max')) then raise exception 'Filtro incompatível';end if;
  if field in ('price','year','mileage','displacement','axles','length','hours','quantity') then
   v:=replace(v,',','.'); max_scale:=case when field in ('price','length') then 2 else 0 end;
   if v!~ '^\d+(\.\d+)?$' or (max_scale=0 and v!~ '^\d+$') then raise exception 'Número inválido';end if;
   n:=v::numeric;
   lo:=case when field='year' then 1900 when field in ('price','length') then .01 when field in ('displacement','axles','quantity') then 1 else 0 end;
   hi:=case field when 'price' then 999999999999.99 when 'year' then extract(year from current_date)+1 when 'mileage' then 10000000 when 'displacement' then 100000 when 'axles' then 20 when 'length' then 500 else 1000000 end;
   if n<lo or n>hi or scale(n)>max_scale then raise exception 'Limite inválido'; end if;
   if bound='min' and nullif(f->>(field||':max'),'') is not null and n>replace(f->>(field||':max'),',','.')::numeric then raise exception 'Intervalo invertido';end if;
   expr:=case when field='price' then 'l.price' else format('(case when l.attributes->>%L ~ ''^\d+(\.\d+)?$'' then (l.attributes->>%L)::numeric end)',field,field) end;
   predicate:=predicate||format(' and %s %s %L::numeric',expr,case bound when 'min' then '>=' when 'max' then '<=' else '=' end,v);
  else
   if bound<>'' then raise exception 'Intervalo exige número';end if;
   expr:=case when field='location' then 'l.location' else format('(l.attributes->>%L)',field) end;
   if field in ('brand','model','version','fuel','transmission','condition') then predicate:=predicate||format(' and %s=%L',expr,v);
   else predicate:=predicate||format(' and strpos(lower(%s),lower(%L))>0',expr,v);end if;
  end if;
 end loop;
 if coalesce((p_options->>'favoritesOnly')::boolean,false) then
  if jsonb_typeof(coalesce(p_options->'favorites','[]'))<>'array' or jsonb_array_length(coalesce(p_options->'favorites','[]'))>1000 then raise exception 'Favoritos inválidos';end if;
  predicate:=predicate||format(' and l.id in (select value::uuid from jsonb_array_elements_text(%L::jsonb))',coalesce(p_options->'favorites','[]')::text);
 end if;
 ordering:=case p_options->>'sort' when 'price-asc' then 'price asc,id' when 'price-desc' then 'price desc,id' else 'created_at desc,id' end;
 execute format('with filtered as materialized (select l.* from public.listings l where %s) select jsonb_build_object(''count'',(select count(*) from filtered),''rows'',coalesce((select jsonb_agg(to_jsonb(r)) from (select * from filtered order by %s offset %s limit %s) r),''[]''::jsonb))',predicate,ordering,p_offset,p_limit) into result;
 return result;
end $$;
revoke all on function public.search_listings(jsonb,integer,integer) from public;
grant execute on function public.search_listings(jsonb,integer,integer) to anon,authenticated;
-- Applies publication predicate even for owner/team; no private data in public discovery.
create function public.listing_choices(p_category text,p_subcategory text,p_field text,p_brand text default '',p_model text default '')
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_field not in ('brand','model','version') then raise exception 'Característica inválida';end if;
 select coalesce(jsonb_agg(v order by v),'[]') into result from (
 select distinct attributes->>p_field as v from public.listings
 where publication_status='published' and category=p_category and (p_subcategory='' or subcategory=p_subcategory)
 and (p_field='brand' or p_brand='' or attributes->>'brand'=p_brand)
 and (p_field<>'version' or p_model='' or attributes->>'model'=p_model)
 and nullif(btrim(attributes->>p_field),'') is not null
 ) options;return result;
end $$;
revoke all on function public.listing_choices(text,text,text,text,text) from public;
grant execute on function public.listing_choices(text,text,text,text,text) to anon,authenticated;
commit;
