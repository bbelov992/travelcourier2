-- Sync request form fields with the data stored in Supabase.
-- Run this in the Supabase SQL editor before production deploy.

alter table if exists public.requests
  add column if not exists sender_name text;

alter table if exists public.requests
  add column if not exists contact text;

alter table if exists public.requests
  add column if not exists description text;

alter table if exists public.requests
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.orders
  add column if not exists sender_name text;

alter table if exists public.orders
  add column if not exists description text;

alter table if exists public.orders
  add column if not exists message text;

alter table if exists public.orders
  add column if not exists contact text;

alter table if exists public.orders
  add column if not exists weight numeric;

alter table if exists public.orders
  add column if not exists request_id uuid;

alter table if exists public.orders
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.orders
  add column if not exists courier_id uuid;

alter table if exists public.profiles
  add column if not exists rating numeric not null default 0;

alter table if exists public.profiles
  add column if not exists completed_deliveries integer not null default 0;

alter table if exists public.profiles
  add column if not exists is_verified boolean not null default false;

alter table if exists public.routes
  add column if not exists transport_type text default 'other';

alter table if exists public.routes
  add column if not exists departure_time time;

alter table if exists public.routes
  add column if not exists price_amount numeric;

alter table if exists public.routes
  add column if not exists price_currency text default 'EUR';

alter table if exists public.routes
  add column if not exists courier_comment text;

alter table if exists public.orders
  alter column status set default 'active';

update public.orders
set status = 'active'
where status = 'pending' or status is null;

update public.requests
set status = 'pending'
where status is null;

update public.requests as requests
set sender_name = coalesce(requests.sender_name, profiles.full_name)
from public.profiles as profiles
where profiles.id = requests.sender_id
  and requests.sender_name is null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'orders'
  ) then
    update public.orders as orders
    set sender_name = coalesce(orders.sender_name, requests.sender_name),
        description = coalesce(orders.description, requests.description),
        message = coalesce(orders.message, requests.message),
        contact = coalesce(orders.contact, requests.contact),
        weight = coalesce(orders.weight, requests.weight)
    from public.requests as requests
    where requests.id = orders.request_id;
  end if;
end $$;

create index if not exists requests_sender_status_idx
  on public.requests (sender_id, status);

create index if not exists requests_route_status_idx
  on public.requests (route_id, status);

create index if not exists orders_sender_status_idx
  on public.orders (sender_id, status);

create index if not exists orders_route_status_idx
  on public.orders (route_id, status);

create index if not exists orders_request_id_idx
  on public.orders (request_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'routes_transport_type_check'
  ) then
    alter table public.routes
      add constraint routes_transport_type_check
      check (transport_type in ('plane', 'train', 'car', 'bus', 'other'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'routes_price_amount_check'
  ) then
    alter table public.routes
      add constraint routes_price_amount_check
      check (price_amount is null or price_amount >= 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'requests_sender_id_fkey'
  ) then
    alter table public.requests
      add constraint requests_sender_id_fkey
      foreign key (sender_id)
      references auth.users (id)
      on delete cascade
      not valid;
  end if;
end $$;

create table if not exists public.reviews (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  courier_id uuid not null,
  sender_id uuid not null,
  rating integer not null,
  comment text null,
  created_at timestamptz not null default now(),
  constraint reviews_pkey primary key (id),
  constraint reviews_order_unique unique (order_id),
  constraint reviews_order_id_fkey foreign key (order_id)
    references public.orders (id) on delete cascade,
  constraint reviews_courier_id_fkey foreign key (courier_id)
    references auth.users (id) on delete cascade,
  constraint reviews_sender_id_fkey foreign key (sender_id)
    references auth.users (id) on delete cascade,
  constraint reviews_rating_check check (rating between 1 and 5)
);

create index if not exists reviews_courier_id_idx
  on public.reviews (courier_id);

create index if not exists reviews_sender_id_idx
  on public.reviews (sender_id);

alter table public.reviews enable row level security;

drop policy if exists reviews_select_own on public.reviews;
drop policy if exists reviews_insert_completed_sender_order on public.reviews;

create policy reviews_select_own
on public.reviews
for select
to authenticated
using (
  sender_id = auth.uid()
  or courier_id = auth.uid()
);

create policy reviews_insert_completed_sender_order
on public.reviews
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.orders
    where orders.id = reviews.order_id
      and orders.sender_id = auth.uid()
      and orders.courier_id = reviews.courier_id
      and orders.status = 'completed'
  )
);

create or replace function public.refresh_courier_rating(target_courier_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set rating = coalesce((
        select round(avg(reviews.rating)::numeric, 2)
        from public.reviews
        where reviews.courier_id = target_courier_id
      ), 0)
  where profiles.id = target_courier_id;
end;
$$;

create or replace function public.handle_reviews_rating_refresh()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_courier_rating(old.courier_id);
    return old;
  end if;

  perform public.refresh_courier_rating(new.courier_id);
  return new;
end;
$$;

drop trigger if exists reviews_refresh_rating_trigger on public.reviews;

create trigger reviews_refresh_rating_trigger
after insert or update or delete on public.reviews
for each row
execute function public.handle_reviews_rating_refresh();

create or replace function public.refresh_courier_completed_deliveries(
  target_courier_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set completed_deliveries = (
    select count(*)::integer
    from public.orders
    where orders.courier_id = target_courier_id
      and orders.status = 'completed'
  )
  where profiles.id = target_courier_id;
end;
$$;

create or replace function public.handle_orders_completed_deliveries_refresh()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'DELETE' then
    if old.courier_id is not null then
      perform public.refresh_courier_completed_deliveries(old.courier_id);
    end if;

    return old;
  end if;

  if new.courier_id is not null then
    perform public.refresh_courier_completed_deliveries(new.courier_id);
  end if;

  if tg_op = 'UPDATE'
    and old.courier_id is not null
    and old.courier_id is distinct from new.courier_id then
    perform public.refresh_courier_completed_deliveries(old.courier_id);
  end if;

  return new;
end;
$$;

drop trigger if exists orders_refresh_completed_deliveries_trigger
  on public.orders;

create trigger orders_refresh_completed_deliveries_trigger
after insert or update or delete on public.orders
for each row
execute function public.handle_orders_completed_deliveries_refresh();
