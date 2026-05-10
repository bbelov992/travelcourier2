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

  if order_status is distinct from 'completed' then
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

notify pgrst, 'reload schema';
