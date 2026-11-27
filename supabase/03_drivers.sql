-- JAMVA: driver (delivery partner) app. Run after 01_schema.sql and 02_seed.sql. Safe to re-run.
alter table jm_drivers add column if not exists vehicle_no text;
alter table jm_drivers add column if not exists licence_no text;
alter table jm_drivers add column if not exists area_id uuid references jm_areas(id);
alter table jm_drivers add column if not exists upi_id text;
alter table jm_drivers add column if not exists bank_account text;
alter table jm_drivers add column if not exists bank_ifsc text;
alter table jm_drivers add column if not exists admin_note text;
alter table jm_drivers add column if not exists approved_at timestamptz;
alter table jm_drivers add column if not exists last_seen_at timestamptz;

alter table jm_orders add column if not exists driver_assigned_at timestamptz;
alter table jm_orders add column if not exists picked_up_at timestamptz;
alter table jm_orders add column if not exists driver_pay_paise int not null default 0;
create index if not exists jm_orders_driver_idx on jm_orders(driver_id, status);

-- Payouts to riders and cash handed in by riders (cash-on-delivery money they collected).
create table if not exists jm_driver_ledger (
  id uuid primary key default gen_random_uuid(), driver_id uuid not null references jm_drivers(id) on delete cascade,
  kind text not null check (kind in ('payout','cash_deposit')), amount_paise int not null check (amount_paise > 0),
  note text, created_at timestamptz not null default now()
);
create index if not exists jm_driver_ledger_idx on jm_driver_ledger(driver_id, created_at desc);
alter table jm_driver_ledger enable row level security;

-- Rider pay settings (percent of the delivery fee, before GST, paid to the rider). Does not overwrite an existing value.
insert into jm_settings(key, value) values ('driver', '{"pay_percent":100,"min_pay":20,"max_active":2}'::jsonb) on conflict (key) do nothing;

-- Atomic claim: only one rider can take an order, and a rider may hold at most p_max active orders.
create or replace function jm_claim_order(p_order uuid, p_driver uuid, p_max int) returns boolean language plpgsql security definer set search_path = public as $$
declare n int; got uuid;
begin
  select count(*) into n from jm_orders where driver_id = p_driver and status in ('accepted','preparing','ready','picked_up');
  if n >= p_max then return false; end if;
  update jm_orders set driver_id = p_driver, driver_assigned_at = now()
   where id = p_order and driver_id is null and status in ('accepted','preparing','ready') returning id into got;
  return got is not null;
end $$;
revoke all on function jm_claim_order(uuid,uuid,int) from public, anon, authenticated;
grant execute on function jm_claim_order(uuid,uuid,int) to service_role;
