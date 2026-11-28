-- JAMVA 05: hardening, performance, realtime and rider GPS. Safe to re-run. Run AFTER 01-04.
-- Does not delete or change existing rows except where noted (housekeeping only touches stale operational rows).

-- 1. Performance ---------------------------------------------------------------------------------
create index if not exists jm_orders_rest_created_idx on jm_orders(restaurant_id, created_at desc);
create index if not exists jm_orders_driver_idx on jm_orders(driver_id, status) where driver_id is not null;
create index if not exists jm_orders_open_idx on jm_orders(status, created_at) where status in ('pending_payment','placed','accepted','preparing','ready','picked_up');
create index if not exists jm_notifications_user_idx on jm_notifications(user_id, created_at desc);

-- 2. Order codes: collision-proof (unique check inside the insert, retried) -------------------------
-- Format stays JV + YYMMDD + 5 characters from an unambiguous alphabet (~28M per day).
create or replace function jm_set_order_code() returns trigger language plpgsql as $$
declare alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int; n int := 0;
begin
  if new.code is not null then return new; end if;
  loop
    c := 'JV' || to_char(now() at time zone 'Asia/Kolkata','YYMMDD');
    for i in 1..5 loop c := c || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from jm_orders where code = c);
    n := n + 1; if n > 20 then raise exception 'could not allocate order code'; end if;
  end loop;
  new.code := c; return new;
end $$;

-- 3. Transactional order creation: order + items + first event in ONE transaction -------------------
create or replace function jm_place_order(p_order jsonb, p_items jsonb) returns jm_orders language plpgsql security definer set search_path = public as $$
declare o jm_orders;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'no items'; end if;
  insert into jm_orders(customer_id, restaurant_id, status, payment_method, payment_status, subtotal_paise, delivery_fee_paise, delivery_gst_paise, total_paise, distance_km, eta_minutes, address, customer_name, customer_phone, notes, placed_at)
  values ((p_order->>'customer_id')::uuid, (p_order->>'restaurant_id')::uuid, p_order->>'status', p_order->>'payment_method', p_order->>'payment_status',
    (p_order->>'subtotal_paise')::int, (p_order->>'delivery_fee_paise')::int, (p_order->>'delivery_gst_paise')::int, (p_order->>'total_paise')::int,
    nullif(p_order->>'distance_km','')::numeric, nullif(p_order->>'eta_minutes','')::int, p_order->'address', p_order->>'customer_name', p_order->>'customer_phone', nullif(p_order->>'notes',''), nullif(p_order->>'placed_at','')::timestamptz)
  returning * into o;
  insert into jm_order_items(order_id, item_id, name, price_paise, qty, is_veg)
  select o.id, (x->>'item_id')::uuid, x->>'name', (x->>'price_paise')::int, (x->>'qty')::int, coalesce((x->>'is_veg')::boolean, false) from jsonb_array_elements(p_items) x;
  insert into jm_order_events(order_id, status, note) values (o.id, o.status, case when o.payment_method = 'cod' then 'Cash on delivery' else 'Waiting for payment' end);
  update jm_profiles set phone = coalesce(nullif(o.customer_phone,''), phone), full_name = coalesce(nullif(o.customer_name,''), full_name) where id = o.customer_id;
  return o;
end $$;
revoke all on function jm_place_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function jm_place_order(jsonb, jsonb) to service_role;

-- 4. Privacy: public (anon) key may read only safe restaurant columns -------------------------------
-- The app reads restaurants on the server with the service role, so nothing breaks. Private columns are no longer readable with the public key.
do $$ declare cols text; begin
  revoke select on jm_restaurants from anon, authenticated;
  select string_agg(quote_ident(column_name), ',') into cols from information_schema.columns
   where table_schema = 'public' and table_name = 'jm_restaurants'
     and column_name not in ('owner_id','admin_note','gstin','fssai_no','owner_name','contact_email','whatsapp','phone','listing_paid_until','trial_until','plan');
  execute format('grant select (%s) on jm_restaurants to anon, authenticated', cols);
end $$;
-- Defence in depth: browsers can never write directly, whatever policies exist.
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'jm\_%' loop
    execute format('revoke insert, update, delete, truncate on %I from anon, authenticated', t);
  end loop;
end $$;
-- Sensitive tables are not readable by browsers at all.
revoke select on jm_admin_emails, jm_rate_limits, jm_webhook_events, jm_payments, jm_push_subscriptions, jm_contact_messages, jm_waitlist from anon, authenticated;

-- 5. Realtime: who may see which rows (used by Supabase Realtime and nothing else) -------------------
create or replace function jm_is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from jm_profiles where id = auth.uid() and role = 'admin') $$;
create or replace function jm_owns_restaurant(rid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from jm_restaurants where id = rid and owner_id = auth.uid()) $$;
create or replace function jm_my_driver() returns uuid language sql stable security definer set search_path = public as $$ select id from jm_drivers where user_id = auth.uid() and status = 'active' $$;
revoke all on function jm_is_admin(), jm_owns_restaurant(uuid), jm_my_driver() from public, anon;
grant execute on function jm_is_admin(), jm_owns_restaurant(uuid), jm_my_driver() to authenticated, service_role;

drop policy if exists jm_orders_self on jm_orders;
create policy jm_orders_self on jm_orders for select to authenticated using (customer_id = auth.uid() or driver_id = jm_my_driver() or jm_owns_restaurant(restaurant_id) or jm_is_admin());

-- Latest rider position per active order. Written only by the server after it checks the rider is assigned.
create table if not exists jm_driver_locations (
  order_id uuid primary key references jm_orders(id) on delete cascade,
  driver_id uuid not null references jm_drivers(id) on delete cascade,
  lat double precision not null, lng double precision not null, heading real, speed real, accuracy real,
  updated_at timestamptz not null default now()
);
alter table jm_driver_locations enable row level security;
revoke all on jm_driver_locations from anon, authenticated; grant select on jm_driver_locations to authenticated;
drop policy if exists jm_loc_view on jm_driver_locations;
create policy jm_loc_view on jm_driver_locations for select to authenticated using (
  jm_is_admin() or driver_id = jm_my_driver() or exists (select 1 from jm_orders o where o.id = order_id and o.customer_id = auth.uid() and o.status in ('ready','picked_up')));

-- PII-free "a delivery is open" signal for riders (so riders never receive customer data they have not claimed).
create table if not exists jm_job_signals (id bigint generated always as identity primary key, order_id uuid not null, created_at timestamptz not null default now());
alter table jm_job_signals enable row level security;
revoke all on jm_job_signals from anon, authenticated; grant select on jm_job_signals to authenticated;
drop policy if exists jm_signal_view on jm_job_signals;
create policy jm_signal_view on jm_job_signals for select to authenticated using (jm_my_driver() is not null or jm_is_admin());
create or replace function jm_order_changed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.driver_id is null and new.status in ('accepted','ready') and (tg_op = 'INSERT' or old.status is distinct from new.status) then insert into jm_job_signals(order_id) values (new.id); end if;
  if new.status in ('delivered','cancelled','rejected') then delete from jm_driver_locations where order_id = new.id; end if; -- location privacy: nothing kept after the trip
  return new;
end $$;
drop trigger if exists jm_orders_changed on jm_orders;
create trigger jm_orders_changed after insert or update of status on jm_orders for each row execute function jm_order_changed();

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table jm_orders; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table jm_driver_locations; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table jm_job_signals; exception when duplicate_object then null; end;
  end if;
end $$;

-- 6. Housekeeping: runs every 5 minutes (pg_cron) or manually: select jm_housekeeping(); ----------------
create or replace function jm_housekeeping() returns jsonb language plpgsql security definer set search_path = public as $$
declare a int; b int; c int; d int; e int; f int;
begin
  -- unpaid online orders older than 30 minutes are cancelled
  with x as (update jm_orders set status = 'cancelled', cancel_reason = 'Payment not completed' where status = 'pending_payment' and created_at < now() - interval '30 minutes' returning id)
  insert into jm_order_events(order_id, status, note) select id, 'cancelled', 'Payment not completed' from x;
  get diagnostics a = row_count;
  -- restaurant never answered within 20 minutes: cancel; paid orders are flagged so the refund is retried from admin
  with x as (update jm_orders set status = 'cancelled', cancel_reason = 'Restaurant did not respond', payment_status = case when payment_status = 'paid' then 'refund_due' else payment_status end
    where status = 'placed' and placed_at < now() - interval '20 minutes' returning id)
  insert into jm_order_events(order_id, status, note) select id, 'cancelled', 'Restaurant did not respond in time' from x;
  get diagnostics b = row_count;
  delete from jm_rate_limits where window_start < now() - interval '1 day'; get diagnostics c = row_count;
  delete from jm_webhook_events where created_at < now() - interval '60 days'; get diagnostics d = row_count;
  delete from jm_notifications where created_at < now() - interval '60 days'; get diagnostics e = row_count;
  delete from jm_job_signals where created_at < now() - interval '1 hour'; get diagnostics f = row_count;
  return jsonb_build_object('unpaid_cancelled', a, 'unanswered_cancelled', b, 'rate_limits', c, 'webhooks', d, 'notifications', e, 'signals', f);
end $$;
revoke all on function jm_housekeeping() from public, anon, authenticated; grant execute on function jm_housekeeping() to service_role;
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'jm_housekeeping';
  perform cron.schedule('jm_housekeeping', '*/5 * * * *', 'select jm_housekeeping()');
exception when others then raise notice 'pg_cron not enabled: enable it in Supabase > Database > Extensions, then re-run this file. (%)', sqlerrm;
end $$;
