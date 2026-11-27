-- JAMVA: schema. Run once in the Supabase SQL editor (safe to re-run). All tables are prefixed jm_.
create extension if not exists pgcrypto;

create table if not exists jm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text,
  role text not null default 'customer' check (role in ('customer','restaurant','driver','admin')),
  created_at timestamptz not null default now()
);
-- Emails listed here become admins automatically when they sign up (or are promoted by 02_seed.sql if they already exist).
create table if not exists jm_admin_emails (email text primary key);
alter table jm_admin_emails enable row level security;
-- Every new sign-up gets a profile. Role is 'customer' unless the email is in jm_admin_emails.
create or replace function jm_handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into jm_profiles(id, full_name, phone, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'phone',''),
    case when exists (select 1 from jm_admin_emails a where lower(a.email) = lower(new.email)) then 'admin' else 'customer' end) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists jm_on_auth_user on auth.users;
create trigger jm_on_auth_user after insert on auth.users for each row execute function jm_handle_new_user();

create table if not exists jm_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());

create table if not exists jm_areas (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
  lat double precision not null, lng double precision not null, is_active boolean not null default true, sort_order int not null default 0
);

create table if not exists jm_addresses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home', line1 text not null, landmark text, area_id uuid references jm_areas(id), pincode text,
  lat double precision, lng double precision, is_default boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists jm_addresses_user_idx on jm_addresses(user_id);

create table if not exists jm_restaurants (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique not null, name text not null, tagline text, description text,
  cuisines text[] not null default '{}', area_id uuid references jm_areas(id), address text not null,
  lat double precision, lng double precision, phone text not null, contact_email text, whatsapp text,
  fssai_no text, gstin text, owner_name text,
  logo_url text, cover_url text, veg_only boolean not null default false,
  prep_minutes int not null default 25, min_order_paise int not null default 0,
  opens_at time default '10:00', closes_at time default '23:00',
  is_open boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  admin_note text, trial_until date, listing_paid_until date,
  created_at timestamptz not null default now(), approved_at timestamptz
);
create index if not exists jm_restaurants_status_idx on jm_restaurants(status, area_id);
create index if not exists jm_restaurants_owner_idx on jm_restaurants(owner_id);

create table if not exists jm_menu_categories (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references jm_restaurants(id) on delete cascade,
  name text not null, sort_order int not null default 0
);
create table if not exists jm_menu_items (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references jm_restaurants(id) on delete cascade,
  category_id uuid references jm_menu_categories(id) on delete set null,
  name text not null, description text, price_paise int not null check (price_paise >= 0), is_veg boolean not null default true,
  image_url text, is_available boolean not null default true, sort_order int not null default 0, created_at timestamptz not null default now()
);
create index if not exists jm_menu_items_rest_idx on jm_menu_items(restaurant_id);

create table if not exists jm_drivers ( -- phase 2 (driver app); table exists so orders can reference it
  id uuid primary key default gen_random_uuid(), user_id uuid unique references auth.users(id) on delete cascade,
  name text not null, phone text not null, vehicle text, status text not null default 'pending' check (status in ('pending','active','blocked')),
  is_online boolean not null default false, created_at timestamptz not null default now()
);

create table if not exists jm_orders (
  id uuid primary key default gen_random_uuid(), code text unique,
  customer_id uuid not null references auth.users(id), restaurant_id uuid not null references jm_restaurants(id),
  driver_id uuid references jm_drivers(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','placed','accepted','preparing','ready','picked_up','delivered','cancelled','rejected')),
  payment_method text not null check (payment_method in ('online','cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refund_due','refunded','cod_due','cod_collected')),
  subtotal_paise int not null, delivery_fee_paise int not null, delivery_gst_paise int not null, total_paise int not null,
  distance_km numeric(5,2), eta_minutes int,
  address jsonb not null, customer_name text, customer_phone text not null, notes text, cancel_reason text,
  razorpay_order_id text, razorpay_payment_id text,
  placed_at timestamptz, accepted_at timestamptz, ready_at timestamptz, delivered_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists jm_orders_cust_idx on jm_orders(customer_id, created_at desc);
create index if not exists jm_orders_rest_idx on jm_orders(restaurant_id, status, created_at desc);
create or replace function jm_set_order_code() returns trigger language plpgsql as $$
begin
  if new.code is null then new.code := 'JV' || to_char(now() at time zone 'Asia/Kolkata','YYMMDD') || lpad((floor(random()*10000))::int::text, 4, '0'); end if;
  return new;
end $$;
drop trigger if exists jm_orders_code on jm_orders;
create trigger jm_orders_code before insert on jm_orders for each row execute function jm_set_order_code();

create table if not exists jm_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references jm_orders(id) on delete cascade,
  item_id uuid references jm_menu_items(id) on delete set null, name text not null, price_paise int not null, qty int not null check (qty > 0), is_veg boolean not null default true
);
create index if not exists jm_order_items_order_idx on jm_order_items(order_id);
create table if not exists jm_order_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references jm_orders(id) on delete cascade,
  status text not null, note text, created_at timestamptz not null default now()
);

create table if not exists jm_payments (
  id uuid primary key default gen_random_uuid(), purpose text not null check (purpose in ('order','listing')),
  order_id uuid references jm_orders(id) on delete set null, restaurant_id uuid references jm_restaurants(id) on delete set null, user_id uuid references auth.users(id) on delete set null,
  amount_paise int not null, gst_paise int not null default 0, status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  razorpay_order_id text unique, razorpay_payment_id text, method text, raw jsonb, created_at timestamptz not null default now(), paid_at timestamptz
);
create table if not exists jm_webhook_events (event_id text primary key, event_type text, payload jsonb, processed boolean not null default false, processed_at timestamptz, created_at timestamptz not null default now());

create table if not exists jm_notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, body text, href text, is_read boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists jm_notifications_user_idx on jm_notifications(user_id, is_read, created_at desc);
create table if not exists jm_push_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text unique not null, p256dh text not null, auth text not null, created_at timestamptz not null default now()
);
create table if not exists jm_waitlist (
  id uuid primary key default gen_random_uuid(), name text, phone text, email text, area_slug text, kind text not null default 'customer' check (kind in ('customer','restaurant','driver')),
  created_at timestamptz not null default now()
);
create table if not exists jm_contact_messages (id uuid primary key default gen_random_uuid(), name text, email text, phone text, message text not null, created_at timestamptz not null default now());
create table if not exists jm_rate_limits (key text primary key, window_start timestamptz not null default now(), hits int not null default 0);

create or replace function jm_rate_hit(p_key text, p_window int, p_max int) returns boolean language plpgsql security definer set search_path = public as $$
declare r jm_rate_limits%rowtype;
begin
  insert into jm_rate_limits(key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when jm_rate_limits.window_start < now() - make_interval(secs => p_window) then 1 else jm_rate_limits.hits + 1 end,
    window_start = case when jm_rate_limits.window_start < now() - make_interval(secs => p_window) then now() else jm_rate_limits.window_start end
  returning * into r;
  return r.hits <= p_max;
end $$;
revoke all on function jm_rate_hit(text,int,int) from public, anon, authenticated;
grant execute on function jm_rate_hit(text,int,int) to service_role;

-- Row level security: the browser (anon key) may only read public catalogue data. Everything else goes through the server (service role).
do $$ declare t text; begin
  for t in select unnest(array['jm_profiles','jm_settings','jm_areas','jm_addresses','jm_restaurants','jm_menu_categories','jm_menu_items','jm_drivers','jm_orders','jm_order_items','jm_order_events','jm_payments','jm_webhook_events','jm_notifications','jm_push_subscriptions','jm_waitlist','jm_contact_messages','jm_rate_limits']) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
drop policy if exists jm_pub_areas on jm_areas; create policy jm_pub_areas on jm_areas for select using (is_active);
drop policy if exists jm_pub_settings on jm_settings; create policy jm_pub_settings on jm_settings for select using (key in ('fees','listing','brand'));
drop policy if exists jm_pub_rest on jm_restaurants; create policy jm_pub_rest on jm_restaurants for select using (status = 'approved');
drop policy if exists jm_pub_cats on jm_menu_categories; create policy jm_pub_cats on jm_menu_categories for select using (exists (select 1 from jm_restaurants r where r.id = restaurant_id and r.status = 'approved'));
drop policy if exists jm_pub_items on jm_menu_items; create policy jm_pub_items on jm_menu_items for select using (exists (select 1 from jm_restaurants r where r.id = restaurant_id and r.status = 'approved'));

-- Storage bucket for restaurant logos, covers and dish photos (public read; uploads go through the server).
insert into storage.buckets(id, name, public) values ('jm-media','jm-media',true) on conflict (id) do update set public = true;
