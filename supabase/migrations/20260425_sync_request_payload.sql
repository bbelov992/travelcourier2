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
