create extension if not exists pgcrypto;
create table if not exists public.products(id uuid primary key default gen_random_uuid(),name text not null,category text not null default 'Research Materials',description text not null default '',price_cents integer not null check(price_cents>=0),stock integer not null default 0 check(stock>=0),image_url text,active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.orders(id uuid primary key default gen_random_uuid(),status text not null default 'pending',total_cents integer not null,items jsonb not null,stripe_session_id text unique,created_at timestamptz not null default now());
alter table public.products enable row level security;alter table public.admins enable row level security;alter table public.orders enable row level security;
create policy "Read active products or admin" on public.products for select to anon,authenticated using(active or exists(select 1 from public.admins where user_id=(select auth.uid())));
create policy "Admin insert products" on public.products for insert to authenticated with check(exists(select 1 from public.admins where user_id=(select auth.uid())));
create policy "Admin update products" on public.products for update to authenticated using(exists(select 1 from public.admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.admins where user_id=(select auth.uid())));
create policy "Admin read admins" on public.admins for select to authenticated using(user_id=(select auth.uid()));
create policy "Admin read orders" on public.orders for select to authenticated using(exists(select 1 from public.admins where user_id=(select auth.uid())));
create or replace function public.fulfill_order(p_order_id uuid,p_session_id text) returns void language plpgsql security definer set search_path=public as $$ declare o public.orders%rowtype; i jsonb; available integer; begin
if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
select * into o from public.orders where id=p_order_id for update;if not found then raise exception 'Order missing';end if;
if o.status='paid' then return;end if;
if o.stripe_session_id is distinct from p_session_id then raise exception 'Session mismatch';end if;
for i in select * from jsonb_array_elements(o.items) loop
update public.products set stock=stock-(i->>'quantity')::integer where id=(i->>'id')::uuid and stock >= (i->>'quantity')::integer returning stock into available;
if not found then raise exception 'Insufficient stock for order %',p_order_id;end if;
end loop;
update public.orders set status='paid' where id=p_order_id;
end $$;
revoke all on function public.fulfill_order(uuid,text) from public,anon,authenticated;
grant execute on function public.fulfill_order(uuid,text) to service_role;
