-- Nova migração. Aplicar somente após inspeção e confirmação do esquema vehicles.
begin;
alter table public.vehicles add constraint vehicles_positive_price check (price > 0 and price <= 999999999999.99 and price <> 'NaN'::numeric);
alter table public.vehicles add constraint vehicles_trimmed_title check (title=trim(title) and length(title) between 1 and 150);
commit;
