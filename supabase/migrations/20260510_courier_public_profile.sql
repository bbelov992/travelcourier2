create or replace function public.get_courier_public_profile(
  courier_profile_id uuid
)
returns table (
  id uuid,
  full_name text,
  rating numeric,
  completed_deliveries integer,
  is_verified boolean,
  review_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select profiles.id,
         coalesce(nullif(btrim(profiles.full_name), ''), 'Курьер') as full_name,
         profiles.rating,
         profiles.completed_deliveries,
         profiles.is_verified,
         count(reviews.id)::integer as review_count
  from public.profiles as profiles
  left join public.reviews as reviews on reviews.courier_id = profiles.id
  where profiles.id = courier_profile_id
    and profiles.role = 'courier'
  group by profiles.id,
           profiles.full_name,
           profiles.rating,
           profiles.completed_deliveries,
           profiles.is_verified;
$$;

create or replace function public.get_courier_public_deliveries(
  courier_profile_id uuid
)
returns table (
  order_id uuid,
  route_id uuid,
  from_city text,
  to_city text,
  departure_date text,
  sender_name text,
  weight numeric,
  order_created_at timestamptz,
  review_id uuid,
  review_rating integer,
  review_comment text,
  review_created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select orders.id as order_id,
         orders.route_id,
         routes.from_city,
         routes.to_city,
         routes.departure_date::text,
         nullif(btrim(orders.sender_name), '') as sender_name,
         orders.weight,
         orders.created_at as order_created_at,
         reviews.id as review_id,
         reviews.rating as review_rating,
         reviews.comment as review_comment,
         reviews.created_at as review_created_at
  from public.orders as orders
  left join public.routes as routes on routes.id = orders.route_id
  left join public.reviews as reviews on reviews.order_id = orders.id
  where coalesce(orders.courier_id, routes.courier_id) = courier_profile_id
    and orders.status = 'completed'
  order by coalesce(reviews.created_at, orders.created_at) desc;
$$;

create or replace function public.refresh_courier_completed_deliveries(
  target_courier_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set completed_deliveries = (
    select count(*)::integer
    from public.orders as orders
    left join public.routes as routes on routes.id = orders.route_id
    where coalesce(orders.courier_id, routes.courier_id) = target_courier_id
      and orders.status = 'completed'
  )
  where profiles.id = target_courier_id;
end;
$$;

update public.profiles
set rating = coalesce((
      select round(avg(reviews.rating)::numeric, 2)
      from public.reviews as reviews
      where reviews.courier_id = profiles.id
    ), 0),
    completed_deliveries = (
      select count(*)::integer
      from public.orders as orders
      left join public.routes as routes on routes.id = orders.route_id
      where coalesce(orders.courier_id, routes.courier_id) = profiles.id
        and orders.status = 'completed'
    )
where profiles.role = 'courier';

revoke all on function public.get_courier_public_profile(uuid) from public;
revoke all on function public.get_courier_public_deliveries(uuid) from public;
grant execute on function public.get_courier_public_profile(uuid) to anon, authenticated;
grant execute on function public.get_courier_public_deliveries(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
