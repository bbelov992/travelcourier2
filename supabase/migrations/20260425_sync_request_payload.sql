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

create or replace function public.submit_order_review(
  review_order_id uuid,
  review_rating integer,
  review_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_sender_id uuid := auth.uid();
  order_sender_id uuid;
  order_courier_id uuid;
  order_status text;
  review_id uuid;
begin
  if current_sender_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if review_rating < 1 or review_rating > 5 then
    raise exception 'Rating must be between 1 and 5' using errcode = '22023';
  end if;

  select orders.sender_id,
         coalesce(orders.courier_id, routes.courier_id),
         orders.status
  into order_sender_id, order_courier_id, order_status
  from public.orders as orders
  left join public.routes as routes on routes.id = orders.route_id
  where orders.id = review_order_id;

  if order_sender_id is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  if order_sender_id is distinct from current_sender_id then
    raise exception 'Only the sender can review this order' using errcode = '42501';
  end if;

  if order_status <> 'completed' then
    raise exception 'Only completed orders can be reviewed' using errcode = '42501';
  end if;

  if order_courier_id is null then
    raise exception 'Courier is missing for this order' using errcode = '23502';
  end if;

  insert into public.reviews (
    order_id,
    courier_id,
    sender_id,
    rating,
    comment
  )
  values (
    review_order_id,
    order_courier_id,
    current_sender_id,
    review_rating,
    nullif(btrim(review_comment), '')
  )
  on conflict (order_id) do update
  set rating = excluded.rating,
      comment = excluded.comment
  returning id into review_id;

  return review_id;
end;
$$;

revoke all on function public.submit_order_review(uuid, integer, text) from public;
grant execute on function public.submit_order_review(uuid, integer, text) to authenticated;

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
